'use strict';

import {Collection} from '../data/collection.js';

class DashboardCollection extends Collection {

    constructor(DataProvider, $q, Auth, DashboardFactory, CardCacheHelperService, $log, CardFullInfoLoadingService,
                DashboardCacheHelperService, AppEventsService, DeregisterService) {
        super();
        this.$q = $q;
        this.$log = $log;
        this.Auth = Auth;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.DashboardFactory = DashboardFactory;
        this.DeregisterService = DeregisterService;
        this.CardCacheHelperService = CardCacheHelperService;
        this.DashboardCacheHelperService = DashboardCacheHelperService;

        this.watchers = this.DeregisterService.create();

        this.items = [];
        this.firstLoad = true;
        this.loadPromise = null;

        // Clear everything on logout
        this.Auth.on('logout', () => this.unload());
        this.watchers.onRoot('dashboard.invalidate', () => this.invalidate());

        CardFullInfoLoadingService.collection = this;
    }
    
    api(useCache) {
        return this.DataProvider.get('dashboard/all', {}, useCache);
    }

    load(useCache = true) {
        //we always do reload on first time loading since dashboards could change
        useCache = !this.firstLoad && useCache;
        this.firstLoad = false;
        if (this.loadPromise && useCache) return this.loadPromise();
    
        this.loadPromise = () => {
            return this.api(useCache).then(response => {
                let dashboards = response.dashboards.slice();
        
                // TODO Favourite dashboard should be removed from current user completely
                if(response.favouriteDashboardId) {
                    dashboards = dashboards.filter(dashboard => {
                        return dashboard.id !== response.favouriteDashboardId;
                    });
                }
        
                dashboards.forEach(item => {
                    if(!item) return;
                    
                    if(this.getById(item.id)) {
                        let existingDashboard = this.getById(item.id);
    
                        return existingDashboard.update(item);
                    }
                    
                    this.addItem(this.DashboardFactory.create(item, this.DataProvider));
                });
        
                this.sort();
                return this.items;
            }).catch(() => {
                this.loadPromise = null;
                this.clear();
            }).finally(() => {
                this.trigger('loaded');
            });
        };
        
        return this.loadPromise();
    }
    
    loadUserDashboards(){
        return this.load().then(() => {
            // If user is not admin he can only see his own dashboards in card builder
            return this.Auth.user.isAdmin() ? this.items : this.items.filter((dashboard) => {
                return !dashboard.isOrganisationDashboard();
            });
        });
    }

    reload() {
        return this.load(false);
    }

    unload() {
        this.clear();
    }

    setActiveDashboard(dashboardId) {
        let dashboard = this.getById(dashboardId);
        if (!dashboard) return false;
        this.deactivateDashboards();
        dashboard.activate();
        return true;
    }

    deactivateDashboards() {
        this.items.forEach(dash => dash.deactivate());
    }

    /**
     * @returns {DashboardModel|null}
     */
    getActiveDashboard() {
        let dashboard = this.items.filter(dashboard => dashboard.isActive());
        return dashboard[0] || null;
    }

    findCard(cardId) {
        let card = null;
        this.items.every(dash => {
            card = dash.cards.getById(cardId);
            return !card;
        });
        return card;
    }

    /**
     * @param {Card} card
     * @return {DashboardModel}
     */
    findByCard(card){
        return this.items.reduce((found, dash) => {
            if(dash.cards.getById(card.id)){
                found = dash;
            }

            return found;
        }, false);
    }
    
    loadByCardId(id) {
        return this.DataProvider.get('dashboard/byCard/' + id, {}, false).then((dashboard) => {
            return this.getById(dashboard.id);
        }).catch(() => {
            return this.$q.reject('Card not found in any of available dashboards');
        });
    }

    moveCard(fromDashboard, toDashboard, card) {
        toDashboard.cards.add(card);
        fromDashboard.cards.remove(card.id);
        this.invalidate();
    }

    invalidate() {
        this.$log.log('cache:dashboard: cleared');
        this.DashboardCacheHelperService.clear();
        this.DataProvider.clearUrlCache('dashboard/cards', 'GET');
        this.firstLoad = true;
    }

    sort() {
        //organisation folders last then sort by id (oldest first)
        this.items.sort((a, b) => {
            if (a.isOrganisationDashboard() && b.isOrganisationDashboard() ||
                !a.isOrganisationDashboard() && !b.isOrganisationDashboard()) {
                return a.id - b.id;
            }
            if (!a.isOrganisationDashboard() && b.isOrganisationDashboard()) return -1;
            return 1;
        });
    }

    create(dashData) {
        let params = {
            name: dashData.name,
            description: dashData.description,
            timezone: dashData.timezone,
            useTimezone: dashData.useTimezone,
            startDayOfWeek: dashData.startDayOfWeek,
            useStartDayOfWeek: dashData.useStartDayOfWeek,
        };

        if (dashData.folder) params.folderId = dashData.folder.id;
        if (dashData.active !== undefined) params.active = dashData.active;

        return this.DataProvider.post('dashboard/create', params, {}).then(dashboard => {
            if (!this.getById(dashboard.id)) {
                this.DashboardCacheHelperService.addToCache(dashboard, params.folderId);
                this.addItem(this.DashboardFactory.create(dashboard, this.DataProvider));
            }

            this.trigger('created', {dashboard: dashboard, folderId: params.folderId});
    
            this.AppEventsService.track('created-dashboard', {id: dashboard.id});

            return dashboard;
        });
    }

    remove(dashboard) {
        return this.DataProvider.get('dashboard/delete/' + dashboard.id, {}, false).then(() => {
            if (this.getById(dashboard.id)) {
                this.CardCacheHelperService.resetMetricUsageCache(dashboard.metricIds());
                this.DashboardCacheHelperService.removeFromCache(dashboard);
                this.removeItem(this.getById(dashboard.id));
            }

            this.trigger('removed', dashboard.id);

            this.AppEventsService.track('removed-dashboard', {id: dashboard.id});
        });
    }

    update(dashboard, params) {
        params.id = dashboard.id;
        return this.DataProvider.post('dashboard/update', params, {}).then(response => {
            // Update dashboard values in current session
            this.trigger('updated', dashboard.id);

            this.AppEventsService.track('updated-dashboard', {id: dashboard.id});

            return response;
        });
    }

    copy(params) {
        return this.DataProvider.post('dashboard/cloneDashboard', params, false).then(dashboard => {
            if (!this.getById(dashboard.id)) {
                this.DashboardCacheHelperService.addToCache(dashboard, params.folderId);
                this.addItem(this.DashboardFactory.create(dashboard, this.DataProvider));
            }

            this.trigger('copied', {dashboard: dashboard, folderId: params.folderId});

            this.AppEventsService.track('cloned-dashboard', {source_id: params.dashboardId, cloned_id: dashboard.id});

            return dashboard;
        });
    }

}

truedashApp.service('DashboardCollection', DashboardCollection);
