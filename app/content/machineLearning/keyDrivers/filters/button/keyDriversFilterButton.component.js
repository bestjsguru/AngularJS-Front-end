'use strict';

import '../modal/keyDriversFilterModal.component';

class KeyDriversFilterButtonController {
    constructor($uibModal, $scope, DeregisterService) {
        this.$uibModal = $uibModal;
    
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.filters = [];
        this.actualMetric = null;
    
        this.watchers.onRoot('keyDrivers.filters.changed', (event, filters) => {
            this.filters = filters;
        });
    
        this.watchers.onRoot('keyDrivers.metric.selected', (event, {actual}) => {
            this.actualMetric = actual;
        });
    }
    
    openModal() {
        this.$uibModal.open({
            size: 'lg',
            component: 'appKeyDriversFilterModal',
            resolve: {
                keyDrivers: () => this.keyDrivers,
            }
        });
    }
}

truedashApp.component('appKeyDriversFilterButton', {
    controller: KeyDriversFilterButtonController,
    templateUrl: 'content/machineLearning/keyDrivers/filters/button/keyDriversFilterButton.html',
    bindings: {
        keyDrivers: '=',
    }
});
