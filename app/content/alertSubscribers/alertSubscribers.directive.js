'use strict';

class AlertSubscribersCtrl {
    constructor($scope, $uibModal) {
        this.$scope = $scope;
        this.$uibModal = $uibModal;
        this.modalInstance = null;
    }

    openModal(subscribers, title = false) {

        // If there is already modal active we need to close it before opening new one
        this.modalInstance && this.modalInstance.dismiss();

        this.modalInstance = this.$uibModal.open({
            templateUrl: 'content/alertSubscribers/subscribers.html',
            size: 'md',
            controller: ($scope) => {

                $scope.subscribers = subscribers;
                $scope.title = title;

                $scope.close = () => {
                    this.modalInstance.dismiss();
                    this.modalInstance = null;
                };
            }
        });
    }
}

truedashApp.directive('appAlertSubscribers', () => ({
    controller: AlertSubscribersCtrl,
    controllerAs: 'alertSubscribers',
    restrict: 'A'
}));
