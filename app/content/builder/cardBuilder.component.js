'use strict';

import './dimensions/cardBuilderDimensions.component';
import './actions/cardBuilderActions.component';
import './metrics/cardBuilderMetrics.component';
import './settings/cardBuilderSettings.component';
import './filters/cardBuilderFilters.component';
import './groupings/cardBuilderGroupings.component';
import './visual/cardBuilderVisual.component';
import './sql/cardBuilderSql.component';

import {CardBuilderValidator} from './cardBuilderValidator.js';
import {CardChangeObserver} from '../card/model/card.changeObserver';

class CardBuilderCtrl {
    
    constructor($scope, $q, DashboardCollection, CardFactory, toaster, $state, $stateParams, AppEventsService, DeregisterService,
                Auth, $filter, $window, $log, $timeout, $element, $confirm, CardCacheHelperService, DashboardFolderService) {

        this.$q = $q;
        this.$log = $log;
        this.Auth = Auth;
        this.$scope = $scope;
        this.$state = $state;
        this.$window = $window;
        this.toaster = toaster;
        this.$filter = $filter;
        this.$timeout = $timeout;
        this.$element = $element;
        this.$confirm = $confirm;
        this.initialized = false;
        this.CardFactory = CardFactory;
        this.AppEventsService = AppEventsService;
        this.DeregisterService = DeregisterService;
        this.DashboardCollection = DashboardCollection;
        this.DashboardFolderService = DashboardFolderService;
        this.CardCacheHelperService = CardCacheHelperService;

        this.dashboard = null;
        this.dashboardId = $stateParams.dashboardId;

        this.availableFrequencies = [];
        this.saving = false;
        this.cardInfoFullyLoaded = false;
        this.initCard();
        this.setUpWatchers();

        this.$cardChangeObserver = new CardChangeObserver();
        this.bindExitWithoutSaving();
    }

    bindExitWithoutSaving(){

        this.watchers.on('$stateChangeStart', (event, next, params) => {

            if(next.name != 'login' && !window.SessionCardData.exists()) {
                if(this.isSaveEnabled() && this.$cardChangeObserver.hasChanged()){
                    event.preventDefault();

                    return this.$confirm({
                        title: 'Card not saved',
                        text: 'Click Stay on Page to keep working. Or Exit to leave without changes you made.',
                        ok: 'Exit',
                        cancel: 'Stay on Page'
                    }).then(() => {
                        this.$cardChangeObserver.observe(this.card);
                        this.$state.go(next.name, params);
                    });
                }
            }
        });

        let states = [
            null,
            () => 'If you exit from this form, you would lose all of the changes. Please, save it before.'
        ];

        this.watchers.watch('cb.isSaveEnabled()', (isEnabled) => {
            let index = +(isEnabled && this.$cardChangeObserver.hasChanged());
            this.$window.onbeforeunload = states[index];
        });
    }

    get loading() {
        return this.saving || (this.card && this.card.metrics && this.card.metrics.loading);
    }

    get isError() {
        return this.card.metrics.error;
    }

    destroy() {
        this.unsubscribeCard();
    }

    subscribeCard() {
        this.card.metrics.on('added', this.onMetricAdded, this);
        this.card.metrics.on('removed', this.onMetricRemoved, this);
        this.card.frequencies.on('listUpdated', this.onFrequenciesChange, this);
        this.DashboardCollection.on('created', () => {
            this.loadDashboard().then(() => {
                // If user has no dashboard selected we assume this is
                // users first dashboard and we preselect it
                if(this.userDashboards.length === 1) this.card.dashboard = this.userDashboards[0];
            });
        }, this);
    }

    unsubscribeCard() {
        if (!this.card) return;
        this.card.metrics.off(null, null, this);
        this.card.frequencies.off(null, null, this);
        this.DashboardCollection.off(null, null, this);
    }

    onFrequenciesChange() {
        this.updateAvailableFrequencies();
    }

    onMetricAdded(metric) {
        if (this.card.metrics.length == 1) {
            this.setCardDefaults(metric.name, metric.getDescription(), metric.getType());
        }
        this.updateAvailableFrequencies();
        window.SessionCardData.reset();
    }

    onMetricRemoved() {
        this.updateAvailableFrequencies();
    }

    initCard() {
        var cardId = this.$state.params.cardId;
        this.loadDashboard()
            .then(() => {
                // In case there is no card we don't need to check anything
                if(!cardId) return this.$q.when();
            
                return this.DashboardCollection.loadByCardId(cardId).then((dashboard) => {
                    if(!this.userDashboards.find(item => item.id === dashboard.id)) {
                        this.userDashboards.push(this.reformatDashboardObject(this.DashboardCollection.getById(dashboard.id)));
                    }
                    
                    return dashboard.cards.loadCards();
                }).then(() => {
                    return this.DashboardCollection.findCard(cardId);
                });
            })
            .catch((message) => {
                // Card is not found in any dashboard so we redirect user to default dashboard with a message
                this.toaster.info(message);
                this.$state.go('home');
            })
            .then(card => card ? card.reloadFullInfo().then(() => card) : null)
            .then(card => {
                this.initialized = true;
                let isNewCard = !card;
                
                if(isNewCard) {
                    this.card = this.createNewCard();
    
                    // Limit user selection of dashboards to only the ones he owns
                    this.userDashboards = this.userDashboards.filter(dashboard => dashboard.isOwner());
                } else {
                    this.card = card.clone();
                    this.card.loadDataFromCache = true;
    
                    // Limit user selection of dashboards to only the ones he owns and selected card dashboard
                    this.userDashboards = this.userDashboards.filter(dashboard => dashboard.isOwner() || dashboard.id === this.card.dashboard.id);
                }
    
                window.SessionCardData.preselect(this.card);
                
                this.card.metrics.loadData();

                this.cardValidator = new CardBuilderValidator(this.card);
                this.subscribeCard();

                this.card.autoReload.disable();
                
                // Allow either card owner or organisation admin to edit cards
                if (this.card.createdBy && !this.card.isOwnedByCurrentUser() && !this.Auth.user.isAdmin()) {
                    this.toaster.warning('You cannot edit this card');
                    this.$state.go('cardBuilder');
                    return;
                }

                this.AppEventsService.track('used-card-builder');

                this.updateAvailableFrequencies();
                this.cardInfoFullyLoaded = true;
                this.dashboard = this.card.dashboard;
                this.$cardChangeObserver.observe(this.card);
            });
    }

    createNewCard() {
        let dashboard = this.userDashboards.find(dashboard => dashboard.id == this.dashboardId);
        return this.CardFactory.create(dashboard || this.userDashboards[0]);
    }

    setUpWatchers() {
        this.watchers = this.DeregisterService.create(this.$scope);
        this.$scope.$on('$destroy', this.destroy.bind(this));
    }

    loadDashboard() {
        let promises = [this.DashboardCollection.loadUserDashboards(), this.DashboardFolderService.load()];
        return this.$q.all(promises).then(([dashboards, folders]) => {
            this.DashboardFolderService.mergeFoldersAndDashboards();
            
            this.userDashboards = dashboards.map(dashboard => this.reformatDashboardObject(dashboard, folders));
            
            return this.userDashboards;
        });
    }
    
    reformatDashboardObject(dashboard, folders) {
        return {
            id: dashboard.id,
            name: dashboard.name,
            cards: dashboard.cards,
            folderName: dashboard.inFolder ? folders.getById(dashboard.inFolder).title : '',
            isOwner: () => dashboard.isOwner(),
            isOrganisationDashboard: () => dashboard.isOrganisationDashboard(),
            reachedCardsLimit: dashboard.reachedCardsLimit,
            useTimezone: dashboard.useTimezone,
            timezoneString: () => dashboard.timezoneString(),
            usedStartDayOfWeek: dashboard.usedStartDayOfWeek,
        };
    }

    setCardDefaults(name, description, type) {
        if (!this.card.name) this.card.name = 'New Card';
        if (!this.card.description) this.card.description = '';
        if (type === 'table') this.updateCardType('table', 'table');
    }

    updateDates(dates, range) {
        this.card.updateDates({
            startDate: dates.startDate,
            endDate: dates.endDate
        }, range);
    }

    updateAvailableFrequencies() {
        // slice will create a copy of array. This is required to
        // avoid modification of the original array
        this.availableFrequencies = this.card.frequencies.available.slice();
        this.availableFrequencies.push('Total');
    }

    save() {
        if(!this.cardValidator.canBeSaved()) {
            this.toaster.error(this.cardValidator.message);
            return;
        }

        this.saving = true;

        // Get full dashboard object just to be sure because of hack from loadDashboard()
        this.card.dashboard = this.DashboardCollection.getById(this.card.dashboard.id);

        this.card.save().then(() => {
            this.$cardChangeObserver.observe(this.card);
            this.CardCacheHelperService.resetMetricUsageCache(this.card.metricIds());
            this.$state.go('cardBuilder', {cardId: this.card.id}, {notify: false});
            this.toaster.success('Card saved');
        }).catch((error) => {
            this.toaster.error(error.message);
        }).finally(() => {
            this.saving = false;
        });
    }

    /**
     * @param {Function} setDestination
     */
    saveAndExit(setDestination) {
        setDestination = setDestination || this.exit.bind(this);

        if(!this.cardValidator.canBeSaved()) {
            this.toaster.error(this.cardValidator.message);
            return;
        }

        this.saving = true;
    
        // Get full dashboard object just to be sure because of hack from loadDashboard()
        this.card.dashboard = this.DashboardCollection.getById(this.card.dashboard.id);
        
        this.card.save().then(() => {
            this.$cardChangeObserver.observe(this.card);
            this.CardCacheHelperService.resetMetricUsageCache(this.card.metricIds());
            this.toaster.success('Card saved');
            setDestination();
        }).catch((error) => {
            this.toaster.error(error.message);
        }).finally(() => {
            this.saving = false;
        });
    }

    exit() {
        this.$state.go('dashboard', {dashboardId: this.card.dashboard.id});
    }

    getType() {
        return this.card.types.get();
    }


    updateCardType(type, subType) {

        if(subType === this.card.types.subType) return;

        if (!this.cardValidator.canSetType(type)) {
            this.toaster.warning('Card type not changed. ' + this.cardValidator.message);
            return;
        }

        this.checkForFunnel(type).then(() => {
            let reload = false;
            let alwaysReload = ['numeric', 'heat', 'table', 'funnel', 'gauge'];
            if(alwaysReload.includes(this.card.types.subType)) {
                reload = true;
            } else {
                if (alwaysReload.includes(subType)) reload = true;
            }

            this.card.types.set(type, subType);
            reload && this.card.metrics.loadData(false);
        });
    }

    checkForFunnel(type) {
        if(type != this.card.types.type && type == 'funnel' && !this.card.frequencies.isTotalSelected()) {
            return this.$confirm({
                title: 'Change type to funnel',
                text: 'In order to change card type to funnel, frequency will be changed from ' + this.card.frequencies.selected.capitalizeFirstLetter() +
                      ' to Total. Click Change button in order to continue.',
                ok: 'Change',
                cancel: 'Cancel'
            });
        }

        return this.$q.when(true);
    }

    setFrequency(freq) {
        this.card.frequencies.set(freq);
    }

    updateMoving(moving) {
        this.card.updateDateMoving(moving);
    }

    isSaveEnabled() {
        return this.card && !this.loading;
    }

    isExitEnabled() {
        return !this.loading;
    }
    
    reload() {
        this.card.autoReload.saveState();
        this.card.autoReload.enable();
        
        this.card.metrics.loadData(false).finally(() => {
            this.card.autoReload.rollback();
        });
    }
}

truedashApp.component('appBuilder', {
    controller: CardBuilderCtrl,
    controllerAs: 'cb',
    templateUrl: 'content/builder/cardBuilder.html'
});
