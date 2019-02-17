'use strict';

import '../drilltable/drilltable.component';
import '../annotations/annotations.component';
import '../explain/info/explainCardInfo.component';
import '../explain/definition/explainCardDefinition.component';
import '../explain/sql/explainCardSql.component';

import Tabs from '../../common/tabs';

class ExploreCtrl {
    constructor($scope, $q, DataExportService, $rootScope, $element, $state, $stateParams, toaster,
                Auth, DashboardCollection, AppEventsService, DeregisterService) {
        this.$q = $q;
        this.Auth = Auth;
        this.$scope = $scope;
        this.$state = $state;
        this.toaster = toaster;
        this.$element = $element;
        this.$rootScope = $rootScope;
        this.$stateParams = $stateParams;
        this.AppEventsService = AppEventsService;
        this.DeregisterService = DeregisterService;
        this.DataExportService = DataExportService;
        this.DashboardCollection = DashboardCollection;

        this.watchers = this.DeregisterService.create(this.$scope);

        this.showDrilltable = true;

        this.cardId = $stateParams.cardId;
        this.dashboardId = $stateParams.dashboardId;

        this.tabs = new Tabs(['preview', 'explain', 'annotations', 'alerts']);
        this.tabs.activate(this.$stateParams.tab);
    }

    $onInit() {
        this.initCard();

        this.watchers.onRoot('highchart.click', (event, data) => this.drillDown(data));
        this.watchers.onRoot('DataTable.click', (event, data) => this.drillDown(data));
    }

    setTab(tab) {
        this.tabs.activate(tab);
        this.$state.go('.', {tab: tab}, {notify: false});
    }

    drillDown(value) {
        if(this.loading || !this.card.drill.isActive()) return;
        this.card.drill.drillDown(value);
    }

    exit() {
        if(this.dashboardId) {
            this.$state.go('dashboard', {dashboardId: this.dashboardId});
        } else {
            this.$state.go('home');
        }
    }

    cardAvailableFrequencies() {
        return ["Hourly", "Daily", "Weekly", "Monthly", "Quarterly", "Yearly", "Total"];
    }

    initCard() {
        this.DashboardCollection.load().then(() => {
            return this.DashboardCollection.loadByCardId(this.cardId).then((dashboard) => {
                return dashboard.cards.loadCards();
            }).then(() => {
                return this.DashboardCollection.findCard(this.cardId);
            });
        }).catch((message) => {
            // Card is not found in any dashboard so we redirect user to default dashboard with a message
            this.toaster.info(message);
            this.$state.go('home');
        })
        .then(card => card.reloadFullInfo())
        .then(card => {
            this.card = card;
            this.initialized = true;
            this.card = card.clone();
            this.card.loadDataFromCache = true;
            this.card.saveState();
            this.card.metrics.loadData();
            this.cardInfoFullyLoaded = true;
            this.dashboard = this.card.dashboard;
            this.subscribeCard();

            this.AppEventsService.track('used-explore-mode');
        });
    }

    isLoading() {
        return this.card.drill.loading || this.card.metrics.loading;
    }

    isError() {
        return this.card.metrics.error;
    }

    subscribeCard() {
        this.card.drill.on('reset drillDown drillUp', this.refreshOnDrill, this);
    }

    unsubscribeCard() {
        this.card.drill.off(null, null, this);
    }

    destroy() {
        // if card was not found, no need to destroy anything
        if (!this.card) return;
        this.stopDrill();
        this.unsubscribeCard();
    }

    showTypes() {
        if (this.card.types.subType == 'table') {
            return this.card.metrics.get(0).info && this.card.metrics.get(0).info.dateColumn;
        } else {
            return this.card.isHighchart();
        }
    }

    setType(type) {

        if (_.isObject(type) && 'type' in type && 'subType' in type) {
            return this.updateCardType(type.type, type.subType);
        }

        switch (type) {
            case 'spline':
            case 'symbol':
            case 'mixed':
                return this.updateCardType('line', type);
            case 'horizontal':
                return this.updateCardType('bar', type);
            default:
                return this.updateCardType(type, type);
        }
    }

    getType() {
        if (!this.card) return;

        return this.card.types.subType;
    }

    updateCardType(type, subType) {
        var reload = false;
        if (type != this.card.types.type) {
            if (type == 'funnel' || this.card.types.type == 'funnel' ||
                type == 'table' || this.card.types.type == 'table') {
                reload = true;
            }
        }
    
        this.AppEventsService.track('used-explore-mode-type-change');

        var setRes = this.card.types.set(type, subType);
        if (setRes !== true) {
            this.toaster.info(setRes.message);
        }

        if (reload && !this.card.drill.isActive()) this.card.metrics.loadData();
    }

    setFrequency(frequency) {
        // We do nothing if it's same frequency
        if(this.card.frequencies.is(frequency)) return;
    
        this.AppEventsService.track('used-explore-mode-frequency-change');
    
        this.card.frequencies.set(frequency, false).then(() => {
            return this.reloadDrillAndDrillTable();
        });
    }

    updateDates(dates, range) {
        this.card.updateDates({
            startDate: dates.startDate,
            endDate: dates.endDate
        }, range).then(() => {
            this.reloadDrillAndDrillTable();
    
            this.AppEventsService.track('used-explore-mode-date-change');
        });
    }

    reload() {
        this.card.restoreState();
        this.card.metrics.loadData(false);
    }

    reloadDrillAndDrillTable() {
        var promise = this.$q.when(true);

        if (this.isDrillMode()) promise = this.card.drill.reload();

        return promise.then(() => this.$rootScope.$broadcast('refreshDrillTable'));
    }

    /** ------------------------ DRILLING ---------------------------------- */

    drillUp() {
        this.card.drill.drillUp();
    }

    refreshOnDrill() {
        if(!this.card.drill.getType()) {
            this.setType(this.card.types.getState());
        } else {
            this.setType(this.card.drill.getType());
        }
    }

    startCardDrill() {
        if (this.card.drill.loading) return;
        this.card.drill.startCardDrill();
    }

    startDrill(metric) {
        if (this.card.drill.loading) return;
        this.card.drill.selectMetric(metric);
    }

    stopDrill() {
        this.card.drill.reset();
    }

    isDrillMode() {
        return this.card.drill.isActive();
    }

    isDrilltableVisible() {
        return this.card.isDrillable() && this.showDrilltable;
    }


    /** ------------------------ DRILL TABLE ---------------------------------- */

    toggleShowDrilltable() {
        this.showDrilltable = !this.showDrilltable;
    }

    /** ------------------------ EXPORT ---------------------------------- */

    exportCard(type = 'csv') {
        return this.DataExportService.exportCard(type, this.card);
    }
}

truedashApp.component('tuExplore', {
    controller: ExploreCtrl,
    controllerAs: 'explore',
    templateUrl: 'content/card/explore/explore.html'
});
