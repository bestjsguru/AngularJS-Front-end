import {Config} from '../config';

class CardCacheHelperService {

    constructor(CacheService) {
        this.CacheService = CacheService;
        this.dashboardCardsKey = "GET" + Config.baseUrl + "dashboard/cards/";
        this.existingCardKey = "GET" + Config.baseUrl + "card/existingCard/";
        this.metricUsageKey = "GET" + Config.baseUrl + "metric/usage/";
    }

    remove(cardId, dashboardId) {
        let dashboardCards = this.CacheService.getCache(this.dashboardCardsKey + dashboardId, "cache");

        if (dashboardCards && dashboardCards.length) {
            let currentDashboardCard = dashboardCards.find(item => item.id === cardId);
            dashboardCards = _.without(dashboardCards, currentDashboardCard);

            this.CacheService.put(this.dashboardCardsKey + dashboardId, dashboardCards);
        }
    }

    updatePositionInCache(card, positionId, position) {
        let cardId = card.id;
        let dashboardId = card.dashboard.id;
        let dashboardCards = this.CacheService.getCache(this.dashboardCardsKey + dashboardId, "cache");
    
        if (dashboardCards && dashboardCards.length) {
            let currentDashboardCard = dashboardCards.find(item => item.id === cardId);
        
            if (currentDashboardCard) {
                currentDashboardCard.positionId = positionId;
                currentDashboardCard.position = position;
                this.CacheService.put(this.dashboardCardsKey + dashboardId, dashboardCards);
            }
        }
    }
    
    setCard(dashboard, card) {
        let cardId = card.id;
        let dashboardCards = this.CacheService.getCache(this.dashboardCardsKey + dashboard.id, "cache");
    
        if (dashboardCards) {
            let currentDashboardCard = dashboardCards.length ? dashboardCards.find(item => item.id === cardId) : false;
        
            if (currentDashboardCard) {
                // Update existing card
                Object.assign(currentDashboardCard, {
                    id: card.id,
                    name: card.name,
                    description: card.description,
                    fromDate: card.fromDate,
                    toDate: card.toDate,
                    active: card.active,
                    image: (card.image && card.image.getJson) ? card.image.getJson() : card.image
                });
            } else {
                // Create new card in dashboard cache
                dashboardCards.push(card.originalCardData);
            }
    
            this.CacheService.put(this.dashboardCardsKey + dashboard.id, dashboardCards);
        }
    }
    
    setCards(dashboard, cards) {
        let dashboardCards = this.CacheService.getCache(this.dashboardCardsKey + dashboard.id, "cache");
        
        if (dashboardCards) {
            
            cards.forEach(card => {
                let currentDashboardCard = dashboardCards.length ? dashboardCards.find(item => item.id === card.id) : false;
                
                if (currentDashboardCard) {
                    // Update existing card
                    Object.assign(currentDashboardCard, {
                        id: card.id,
                        name: card.name,
                        description: card.description,
                        fromDate: card.fromDate,
                        toDate: card.toDate,
                        active: card.active,
                        image: (card.image && card.image.getJson) ? card.image.getJson() : card.image
                    });
                } else {
                    // Create new card in dashboard cache
                    dashboardCards.push(card.originalCardData);
                }
            });
    
            this.CacheService.put(this.dashboardCardsKey + dashboard.id, dashboardCards);
        }
    }
    
    addIntegrationLink(data, dashboard) {
        let cardId = data.card;
        let dashboardCards = this.CacheService.getCache(this.dashboardCardsKey + dashboard.id, "cache");
    
        if (dashboardCards) {
            let currentDashboardCard = dashboardCards.length ? dashboardCards.find(item => item.id === cardId) : false;
        
            if (currentDashboardCard) {
                // Update existing card
                if(!_.isArray(currentDashboardCard.cardExportInfos)) {
                    currentDashboardCard.cardExportInfos = [];
                }
    
                // We only add new info if it's not already existing
                if(!currentDashboardCard.cardExportInfos.find(info => info.id === data.id)) {
                    currentDashboardCard.cardExportInfos.push(data);
                }
    
                this.CacheService.put(this.dashboardCardsKey + dashboard.id, dashboardCards);
                
                return currentDashboardCard;
            }
        }
        
        return false;
    }
    
    deleteIntegrationLink(data, dashboard) {
        let cardId = data.card;
        let dashboardCards = this.CacheService.getCache(this.dashboardCardsKey + dashboard.id, "cache");
    
        if (dashboardCards) {
            let currentDashboardCard = dashboardCards.length ? dashboardCards.find(item => item.id === cardId) : false;
        
            if (currentDashboardCard && _.isArray(currentDashboardCard.cardExportInfos)) {
                currentDashboardCard.cardExportInfos = currentDashboardCard.cardExportInfos.filter(info => info.id !== data.id);
    
                this.CacheService.put(this.dashboardCardsKey + dashboard.id, dashboardCards);
                
                return currentDashboardCard;
            }
        }
        
        return false;
    }
    
    getData(cardId) {
        return this.CacheService.get(this.existingCardKey + cardId);
    }

    removeCardDataInCache(cardId) {
        this.CacheService.remove(this.existingCardKey + cardId);
    }

    resetMetricUsageCache(metricIds) {
        // Make sure we have array
        if (!_.isArray(metricIds)) metricIds = [metricIds];

        metricIds.forEach(metricId => {
            this.CacheService.remove(this.metricUsageKey + metricId);
        });
    }

}

truedashApp.service('CardCacheHelperService', CardCacheHelperService);
