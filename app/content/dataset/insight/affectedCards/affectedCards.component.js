'use strict';

import './affectedCardsModal.component';

class AffectedCardsController {
    constructor(DataProvider, $uibModal) {
        this.$uibModal = $uibModal;
        this.DataProvider = DataProvider;
    }
    
    $onInit() {
        this.loading = true;
        this.cards = [];
        
        this.DataProvider.get('metric/usage/' + this.metric.id).then(cards => {
            this.cards = cards || [];
        }).finally(() => {
            this.loading = false;
        });
    }
    
    showCards() {
        this.$uibModal.open({
            size: 'md',
            component: 'appAffectedCardsModal',
            resolve: {
                metric: () => this.metric,
                cards: () => this.cards,
            }
        });
    }
}

truedashApp.component('appAffectedCards', {
    controller: AffectedCardsController,
    templateUrl: 'content/dataset/insight/affectedCards/affectedCards.html',
    bindings: {
        metric: '='
    }
});
