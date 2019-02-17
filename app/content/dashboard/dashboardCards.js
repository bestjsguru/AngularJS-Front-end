'use strict';

import {Collection} from '../data/collection.js';

class DashboardCards extends Collection {

    /**
     * @param $q
     * @param $state
     * @param {DashboardModel} dashboard
     * @param {CardFactory} CardFactory
     * @param {DataProvider} DataProvider
     * @param {CardFullInfoLoadingService} CardFullInfoLoadingService
     * @param {CardCacheHelperService} CardCacheHelperService
     * @param {DashboardCacheHelperService} DashboardCacheHelperService
     */
    constructor(dashboard, CardFactory, $q, DataProvider, $state, CardFullInfoLoadingService, CardCacheHelperService,
                DashboardCacheHelperService) {
        super();
        this.$q = $q;
        this.$state = $state;
        this.dashboard = dashboard;
        this.CardFactory = CardFactory;
        this.CardCacheHelperService = CardCacheHelperService;
        this.DashboardCacheHelperService = DashboardCacheHelperService;
        this.DataProvider = DataProvider;
        this.CardFullInfoLoadingService = CardFullInfoLoadingService;

        this.loaded = false;
        this.cardsPromise = null;
        this.batch = {};
    }

    init(data) {
        if (!data.cards) return;
        this.clear();
        data.cards.forEach(card => this.addItem(this.CardFactory.create(this.dashboard, card)));
    }

    add(cardObj) {
        /** @type {Card} **/
        let card = this.getById(cardObj.id);
        if (card) {
            return this.updateCardData(cardObj);
        }
        if (this.CardFactory.isCard(cardObj)) {
            cardObj.dashboard = this.dashboard;
            card = this.addItem(cardObj);
        } else {
            card = this.addItem(this.CardFactory.create(this.dashboard, cardObj));
        }

        if(!this.batch.enabled) {
            // Preload current user cache with cards
            this.CardCacheHelperService.setCard(this.dashboard, card);
        } else {
            this.batch.items.push(card);
        }

        // this.invalidate();
        return this.$q.when(true).then(() => card);
    }

    // We have to preserve list of card metrics to be the same,
    // and we update rest of cards data received from server
    // @TODO If anyone knows a better solution for this feel free to change this :)
    updateCardData(cardObject) {
        let card = this.getById(cardObject.id);
        let index = this.items.indexOf(card);
        let tmpCard = this.CardFactory.create(this.dashboard, _.clone(cardObject));

        let promise = this.$q.when(true);

        // don't load card data if some other card is viewed in explore mode or card builder
        if(card.isBeingLookedAt()) promise = tmpCard.metrics.getLoadPromise();

        return promise.then(() => {
            // Positioning is staying original for the card because request for
            // additional data can be cached, so positions will not be loaded each time

            let currentDashboardCard = this.items[index];
            for (let key in currentDashboardCard) {
                if (tmpCard.hasOwnProperty(key) && key !== 'positioning') {
                    currentDashboardCard[key] = tmpCard[key];
                }
            }
    
            if(!this.batch.enabled) {
                // Preload current user cache with cards
                this.CardCacheHelperService.setCard(this.dashboard, currentDashboardCard);
            } else {
                this.batch.items.push(currentDashboardCard);
            }

            return currentDashboardCard;
        });
    }

    remove(cardId) {
        let card = this.getById(cardId);
        
        this.CardCacheHelperService.remove(cardId, this.dashboard.id);
        card && this.removeItem(card);
    }
    
    api() {
        return this.DataProvider.get('dashboard/cards/' + this.dashboard.id, {}, true).then(cards => {
            // TODO: Stacked - Remove this after stacked charts are migrated
            cards.forEach(card => {
                if(card.subType === 'stacked') {
                    card.subType = 'bar';
            
                    _.set(card, 'chartSettings.stacked', true);
                }
            });
            
            return cards;
        });
    }

    loadCards() {
        this.items = [];
        this.loaded = false;
        
        this.cardsPromise = this.api().then((cardList) => {
            if (!angular.isArray(cardList)) {
                throw new Error(
                    `For dashboard id = ${this.dashboard.id} there is invalid card list model from server: ${JSON.stringify(cardList)}`
                );
            }
    
            // Order cards by position where cards with no position will be last
            cardList.sort(function (a, b) {
                if(!a.position || isNull(a.position.row) || isNull(a.position.col)) return 1;
                if(!b.position || isNull(b.position.row) || isNull(b.position.col)) return -1;
                
                return a.position.row - b.position.row || a.position.col - b.position.col;
            });

            let promises = [];
    
            // We use batch mode because cache is compressed and we don't want to do decompress/compress for every single card
            // This way it will be done only once when we exit batch mode and all cards will be cached simultaneously
            this.enterBatchCacheMode();
            
            cardList.forEach((data, index) => {
                let rawData = angular.copy(data);

                data.dashboard = this;

                // Push promises in groups of three and add some small delay of 300ms in between so browser doesn't freeze
                promises.push(this.delay(300 * parseInt(index/3)).then(() => {
                    return this.add(data).then(card => card.preloadFullInfo(rawData));
                }));
            });
    
            return this.$q.all(promises).then(() => {
                // We now cache all the cards in one go
                this.exitBatchCacheMode();
            });
        }).catch((e) => {
            this.invalidate();
        }).finally(() => {
            this.loaded = true;
        });

        this.CardFullInfoLoadingService.setDashboard(this.dashboard, this.cardsPromise);

        return this.cardsPromise;
    }
    
    delay(delay) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), delay);
        });
    }

    setCardStatus(card, status) {

        let params = {
            active: status === true || false,
            dashboardId: this.dashboard.id,
            cardId: card.id
        };

        return this.DataProvider.get('dashboard/activateCard', params, false).then((card) => {
            return this.add(card);
        }).then(card => {
            return card.metrics.getLoadPromise();
        }).then(() => {
            return card.getInfoPromise();
        }).finally(() => {
            // Refresh card data so this new status gets pulled correctly
            // this.invalidate();
        });
    }

    getActive() {
        return this.filter(item => item.active === true);
    }

    invalidate() {
        this.cardsPromise = null;
        this.DataProvider.clearCache('dashboard/cards/' + this.dashboard.id, {}, 'GET');
        this.CardFullInfoLoadingService.removeDashboard(this.dashboard);
    }

    bindItem(item) {
        item.on('removed', this.onCardRemoved, this);
        item.on('removed updated', this.onCardUpdated, this);
    }

    unbindItem(item) {
        item.off('removed updated', undefined, this);
    }

    onCardRemoved(card) {
        this.remove(card);
        this.invalidate();
    }

    onCardUpdated() {
        this.invalidate();
    }
    
    enterBatchCacheMode() {
        this.batch = {
            enabled: true,
            items: []
        };
    }
    
    exitBatchCacheMode() {
        this.batch.enabled = false;
        if(!this.batch.items.length) return;
    
        // Preload current user cache with cards
        this.CardCacheHelperService.setCards(this.dashboard, this.batch.items);
    }
}


truedashApp.factory('DashboardCardsFactory',
    (CardFactory, $q, DataProvider, $state, CardFullInfoLoadingService,
     CardCacheHelperService, DashboardCacheHelperService) => {
        return {
            create: (dashboard) => new DashboardCards(dashboard, CardFactory, $q, DataProvider, $state, CardFullInfoLoadingService,
                CardCacheHelperService, DashboardCacheHelperService)
        };
    });
