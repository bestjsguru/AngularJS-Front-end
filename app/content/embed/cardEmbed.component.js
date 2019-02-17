'use strict';

class CardEmbedCtrl {
    constructor(DashboardCollection, toaster, $stateParams, $state) {
        this.$state = $state;
        this.toaster = toaster;
        this.DashboardCollection = DashboardCollection;
        
        this.cardId = $stateParams.cardId;

        this.initCard();
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
                this.card.saveState();
                this.card.types.get() != 'table' && this.card.metrics.loadData();
                this.cardInfoFullyLoaded = true;
                this.dashboard = this.card.dashboard;
            });
    }
}

truedashApp.component('tuCardEmbed', {
    controller: CardEmbedCtrl,
    templateUrl: 'content/embed/cardEmbed.html'
});
