'use strict';

import {EventEmitter} from '../system/events.js';
import {Config} from '../config.js';
import DashboardTheme from './theme/dashboardTheme.model';

class DashboardModel extends EventEmitter {

    /**
     * @param {Auth} Auth
     * @param {DataProvider} DataProvider
     * @param {DashboardCardsFactory} DashboardCardsFactory
     * @param {DashboardUsersFactory} DashboardUsersFactory
     * @param {DashboardFiltersFactory} DashboardFiltersFactory
     */
    constructor(data, DataProvider, Auth, DashboardCardsFactory, DashboardUsersFactory, DashboardFiltersFactory, $q, $rootScope) {
        super();
        this.$q = $q;
        this.$rootScope = $rootScope;
        this.Auth = Auth;
        this.DataProvider = DataProvider;

        /** @type {DashboardCards} **/
        this.cards = DashboardCardsFactory.create(this);
        this.users = DashboardUsersFactory.create(this);
        this.filters = DashboardFiltersFactory.create(this);
        this.inFolder = false;

        this.init(data);
    }

    init(data) {
        data = data || {};
        this.id = data.dashboardId ? data.dashboardId : data.id;
        this.name = data.name;
        this.active = data.active;
        this.position = data.position;
        this.createdBy = data.createdBy;
        this.description = data.description;
        this.organisation = data.organisation;
        this.isFavourite = !! data.isFavourite;
        this.timezone = data.timezone || Config.timezone;
        this.useTimezone = !! data.useTimezone;
        this.startDayOfWeek = data.startDayOfWeek || this.Auth.user.organisation.startDayOfWeek;
        this.useStartDayOfWeek = data.useStartDayOfWeek;
        
        this.setLogo(data.logo);
        
        this.theme = new DashboardTheme(data.themeSettings);

        this.cards.init(data);
    }

    update(data) {
        this.name = data.name;
        this.description = data.description;
        this.timezone = data.timezone || Config.timezone;
        this.useTimezone = data.useTimezone;
        this.startDayOfWeek = data.startDayOfWeek || this.Auth.user.organisation.startDayOfWeek;
        this.useStartDayOfWeek = data.useStartDayOfWeek;
        this.createdBy = data.createdBy;
        
        this.theme = new DashboardTheme(data.themeSettings);
    }
    
    setLogo(url) {
        this.logo = url || Config.dashboard.defaultPhotoUrl;
    }
    
    hasLogo() {
        return this.logo !== Config.dashboard.defaultPhotoUrl;
    }

    reset() {
        this.init({});
    }

    get reachedCardsLimit() {
        return this.cards.length >= 30;
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    isOrganisationDashboard() {
        return !!this.organisation;
    }

    isActive() {
        return this.active;
    }

    isOwner() {
        return this.createdBy == this.Auth.user.username;
    }

    isLocked() {
        return this.isOrganisationDashboard() && !this.Auth.user.isAdmin();
    }

    metricIds() {
        return _.uniq(_.flatten(this.cards.map(card => card.metricIds())));
    }

    timezoneString() {
        if(!this.useTimezone) return '';

        if(this.timezone === 'UTC') return this.timezone;
        
        return this.timezone + ' UTC' + moment().tz(this.timezone).format('Z');
    }
    
    startDayOfWeekName() {
        if(!this.useStartDayOfWeek) return '';
        
        return moment().isoWeekday(this.startDayOfWeek).format('dddd');
    }
    
    get usedStartDayOfWeek() {
        if(!this.useStartDayOfWeek) return this.Auth.user.organisation.startDayOfWeek;
        
        return this.startDayOfWeek;
    }

    trackCardsLoading(withInfo = false) {
        return this.cards.loadCards().then(() => {
            let requests = this.cards.reduce((requests, card) => {
                if(card.active) {
                    requests.push(card.metrics.getLoadPromise());
                    withInfo && requests.push(card.getInfoPromise());
                }

                return requests;
            }, []);

            this.$rootScope.$emit('dashboardModel.loadCards.completed');
            return this.$q.all(requests);
        });
    }
}

truedashApp.factory('DashboardFactory', (DataProvider, Auth, DashboardCardsFactory, DashboardUsersFactory, DashboardFiltersFactory, $q, $rootScope) => {
    return {
        create: (data) => new DashboardModel(data, DataProvider, Auth, DashboardCardsFactory, DashboardUsersFactory, DashboardFiltersFactory, $q, $rootScope)
    };
});



