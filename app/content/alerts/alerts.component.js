'use strict';

import './createAlert.component';

class AlertsCtrl {
    constructor(DeregisterService, $scope, $uibModal, toaster, $q, $stateParams, AppEventsService) {
        this.$q = $q;
        this.$uibModal = $uibModal;
        this.toaster = toaster;
        this.$scope = $scope;
        this.$stateParams = $stateParams;
        this.AppEventsService = AppEventsService;

        this.watchers = DeregisterService.create($scope);

        this.loading = false;
    }

    $onInit() {
        this.loadAlerts();
    }

    loadAlerts() {
        this.loading = true;

        this.card.invalidateFullInfo();

        return this.card.alerts.load(false).then(alerts => {
            let requests = [];
            alerts.forEach(alert => requests.push(alert.subscription.load()));

            return this.$q.all(requests);
        }).then(() => {
            this.loading = false;

            this.AppEventsService.track('viewed-explore-mode-alert-window');
        });
    }

    openModal(alert) {
        // If modal is already opened we have to close it first
        this.createAlertModal && this.createAlertModal.dismiss();

        this.createAlertModal = this.$uibModal.open({
            component: 'appCreateAlert',
            resolve: {
                alert: () => alert,
                card: () => this.card
            }
        });
    }

    deleteAlert(alert) {
        this.card.alerts.remove(alert).then(() => this.toaster.success('Alert deleted'));
    }
}

truedashApp.component('appAlerts', {
    controller: AlertsCtrl,
    templateUrl: 'content/alerts/alerts.html',
    bindings: {
        card: '='
    }
});
