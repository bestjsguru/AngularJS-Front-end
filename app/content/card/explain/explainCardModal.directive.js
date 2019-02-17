'use strict';

import './explainCard.component';

class ExplainCardModalCtrl{
    constructor($uibModal) {
        this.$uibModal = $uibModal;
        this.kpiModal = false;
    }

    open() {
        this.kpiModal && this.kpiModal.dismiss();
        this.kpiModal = this.$uibModal.open({
            component: 'appExplainCard',
            size: 'lg',
            resolve: {
                card: () => this.card
            }
        });
    }
}

truedashApp.directive('appExplainCardModal', () => ({
    controller: ExplainCardModalCtrl,
    controllerAs: '$ctrl',
    scope: true,
    bindToController: {
        card: '='
    },
    restrict: 'A'
}));
