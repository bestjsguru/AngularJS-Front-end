'use strict';

class AffectedCardsModalController {
    constructor() {
    
    }
    
    $onInit() {
        this.metric = this.resolve.metric;
        this.cards = this.resolve.cards;
    }
}

truedashApp.component('appAffectedCardsModal', {
    controller: AffectedCardsModalController,
    templateUrl: 'content/dataset/insight/affectedCards/affectedCardsModal.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
