import {EventEmitter} from '../../system/events.js';

var cardXYPlacements = {};

class Position {
    constructor(position) {
        this.col = position.col;
        this.row = position.row;
        this.sizeX = position.sizeX || 2;
        this.sizeY = position.sizeY || 3;
    }
}

class CardPositioning extends EventEmitter {
    constructor(card, DataProvider, $q, CardCacheHelperService) {
        super();
        this.card = card;
        this.DataProvider = DataProvider;
        this.$q = $q;
        this.cardCacheHelperService = CardCacheHelperService;
        this.initParameters();
    }

    initParameters() {
        this.position = null;
        this.positionId = null;
        this.batchMode = false;
        this.positionPendingUpdates = {};
        this.isPositionInvalid = false;
    }

    initCardXYPlacements() {
        var dashboardId = this.card.dashboard.id;
        var cardId = this.card.id;
        var cardPosition = this.position;

        cardXYPlacements[dashboardId] = cardXYPlacements[dashboardId] || {};
        cardXYPlacements[dashboardId][cardId] = {x: cardPosition.col, y: cardPosition.row};
    }

    init(data) {
    
        let dataPosition = data.position;

        if (window.Location.isPPT) {
            dataPosition = {col: null, row: null, sizeX: 4, sizeY: 6};
        } else {
            if (data.position) {
                this.isPositionInvalid = dataPosition.row === null || dataPosition.col === null || !dataPosition.sizeX || !dataPosition.sizeY;
            } else {
                this.isPositionInvalid = true;
            }
        }

        if (dataPosition && !this.position) {
            this.position = dataPosition;
            this.position.sizeX = this.position.sizeX || 2;
            this.position.sizeY = this.position.sizeY || 3;
            this.initCardXYPlacements();
        }
        if(data.positionId && this.position) {
            this.positionId = this.position.id = data.positionId;
        }
        this.position = this.position || {};
        this.position.updateCardPlacement = this.updateCardPlacement.bind(this);
    }

    initBy(item) {
        if (this.isPositionInvalid) {
            this.updateCardPlacement({
                row: item.row,
                col: item.col,
                sizeX: item.sizeX,
                sizeY: item.sizeY
            });
        }
    }

    updateOtherCardsXY() {
        var dashboardCards = this.card.dashboard.cards;
        var dashboardXYPlaces = cardXYPlacements[this.card.dashboard.id];

        dashboardCards.forEach(card => {
            if (card.positioning.positionId && card != this) {
                var placement = card.positioning.position;
                var cardXYBefore = dashboardXYPlaces[card.id];
                if (cardXYBefore && (placement.col != cardXYBefore.x || placement.row != cardXYBefore.y)) {
                    card.positioning.updatePlacement();
                }
            }
        });
    }

    changePlacement() {
        return this.positionId ? this.updatePlacement() : this.createPlacement();
    }

    createPlacement() {
        var serverData = {
            dashboardId: this.card.dashboard.id,
            cardId: this.card.id
        };
        angular.extend(serverData, new Position(this.position));

        return this.DataProvider.post('card/createPosition', serverData)
            .then((response) => {
                this.card.trigger('updated', this.card);
                this.invalidateGetPosition(response.id);

                if (response.failure) {
                    console.log('error:', response.failure);
                    return response.failure
                }
                this.positionId = response.id;
                this.position.id = response.id;
                this.position.class = response.class;
                this.initCardXYPlacements();
                this.updateCache();
                return response;
            }, (response) => {
                console.log('error:', "Cannot Update the Card's Placement");
            });
    }

    updatePlacement() {
        var serverData = {
            positionId: this.positionId
        };
        angular.extend(serverData, new Position(this.position));

        if (this.batchMode) {
            this.positionPendingUpdates[serverData.positionId] = serverData;
            return this.$q.when('batch');//todo: remove promise from return or return batch promise.
        }

        return this.DataProvider.post('card/updatePosition', serverData)
            .then((response) => {
                this.card.trigger('updated', this.card);
                this.invalidateGetPosition(response.id);

                if (response.failure) {
                    console.log('error:', response.failure);
                    return response.failure;
                }
                this.initCardXYPlacements();
                this.updateCache();
                return response;
            }, (response) => {
                console.log('error:', "Cannot Update the Card's Placement");
            });
    }

    enterBatchMode() {
        if (this.batchMode) return;
        this.batchMode = true;
    }

    exitBatchMode() {
        if (!this.batchMode) return;
        this.batchMode = false;
        var data = [];

        for (var id in this.positionPendingUpdates) {
            data.push(this.positionPendingUpdates[id]);
            delete this.positionPendingUpdates[id];
        }

        this.DataProvider.post('card/updatePositions', data, {'Content-Type': 'application/json'}, false)
            .then(response => {
                this.card.trigger('updated', this.card);
                data.forEach(position => {
                    this.invalidateGetPosition(position.id);
                });

                if (response.failure) {
                    console.log('error:', response.failure);
                    return response.failure;
                }

                this.initCardXYPlacements();
                this.updateCache();
                return response;
            }, response => {
                console.log('error:', 'Cannot Update the Card\'s Placements');
            });
    }

    updateCache() {
        this.cardCacheHelperService.updatePositionInCache(this.card, this.positionId, this.position);
    }

    updateCardPlacement(placement) {
        if(window.Location.isPublish) return;

        this.position.row = this.position.row !== undefined ? this.position.row : placement.row;
        this.position.col = this.position.col !== undefined ? this.position.col : placement.col;
        this.position.sizeX = this.position.sizeX !== undefined ? this.position.sizeX : placement.sizeX;
        this.position.sizeY = this.position.sizeY !== undefined ? this.position.sizeY : placement.sizeY;

        this.enterBatchMode();
        this.changePlacement();
        this.updateOtherCardsXY();
        this.exitBatchMode();
    }

    /** @private */
    invalidateGetPosition(positionId) {
        this.DataProvider.clearCache('card/getPosition/' + positionId, {}, 'GET');
    }

}

truedashApp.service('CardPositioningFactory', (DataProvider, $q, CardCacheHelperService) => ({
    create: (card) => new CardPositioning(card, DataProvider, $q, CardCacheHelperService)
}));
