'use strict';

import '../modal/rootCauseFilterModal.component';

class RootCauseFilterButtonController {
    constructor($uibModal, $scope, DeregisterService) {
        this.$uibModal = $uibModal;
    
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.filters = [];
        this.relation = false;
    
        this.watchers.onRoot('rootCause.filters.changed', (event, filters) => {
            this.filters = filters;
        });
    
        this.watchers.onRoot('rootCause.relation.selected', (event, relation) => {
            this.relation = relation;
        });
    }
    
    openModal() {
        this.$uibModal.open({
            size: 'lg',
            component: 'appRootCauseFilterModal',
            resolve: {
                rootCause: () => this.rootCause,
            }
        });
    }
}

truedashApp.component('appRootCauseFilterButton', {
    controller: RootCauseFilterButtonController,
    templateUrl: 'content/rootCause/filters/button/rootCauseFilterButton.html',
    bindings: {
        rootCause: '=',
    }
});
