'use strict';

const DEFAULT_ORDER = {
    reverse: false,
    predicate: 'formatAlertHeading()'
};

class ProfileAlertsCtrl {
    constructor(CardFactory, $filter, toaster, AppEventsService, AlertsFactory) {
        this.toaster = toaster;
        this.$filter = $filter;
        this.CardFactory = CardFactory;
        this.AlertsFactory = AlertsFactory.create();
    
        AppEventsService.track('visited-alert-page');

        this.loading = false;
        this.searchQuery = '';
        this.listLoading = false;
        this.order  = DEFAULT_ORDER;
        this.show   = {
            my: false,
            all: true,
            setTo: (type) => {
                this.show.my = this.show.all = false;
                this.show[type] = true;
                this.refreshAlertsList();
            }
        };

        this.initAlertsList();
    }

    /**
     * Refresh alerts list based on filters and reset data ordering
     */
    refreshAlertsList() {
        this.alerts = this.show.all ? _.clone(this.allAlerts) : this.allAlerts.filter((alert) => alert.isOwnAlert());
        this.order = DEFAULT_ORDER;
    }

    getAlertsFromServer(useCache = true) {
        return this.AlertsFactory.load(useCache).then((alerts) => {
            this.alerts = this.allAlerts = alerts;
            this.loadAdditionalAlertsData();
            this.refreshAlertsList();
        });
    }

    initAlertsList() {
        this.loading = true;
        this.getAlertsFromServer().then(() => this.loading = false);
    }

    refreshList() {
        this.listLoading = true;
        this.getAlertsFromServer(false).then(() => this.listLoading = false);
    }

    orderBy(predicate) {
        this.alerts = this.$filter('orderBy')(this.alerts, predicate, !this.order.reverse);
        this.order.predicate = predicate;
        this.order.reverse = !this.order.reverse;
    }

    isOrderedBy(predicate) {
        return predicate == this.order.predicate;
    }

    loadAdditionalAlertsData() {
        this.alerts.forEach((alert, key) => {
            // Load card subscribers
            alert.subscription.load().then(() => {
                // Load metric details
                return this.AlertsFactory.loadMetric(alert).then((metric) => {
                    let card = this.CardFactory.create();
                    this.alerts[key].metric = card.metrics.create(metric);
                }).catch(() => {
                    throw new Error('Problem loading metric details for alert ' + alert.id);
                });
            });
        });
    }

    deleteAlert(item) {
        this.AlertsFactory.remove(item).then(() => {
            // Remove deleted alert from alerts list
            this.alerts = this.alerts.filter(value => value.id !== item.id);
            this.allAlerts = this.allAlerts.filter(value => value.id !== item.id);

            this.toaster.success('Alert deleted');
        });
    }
}

truedashApp.directive('tuProfileAlerts', () => ({
    templateUrl: 'content/profile/alert/profileAlerts.html',
    restrict: 'E',
    controllerAs: 'alerts',
    bindToController: true,
    controller: ProfileAlertsCtrl
}));
