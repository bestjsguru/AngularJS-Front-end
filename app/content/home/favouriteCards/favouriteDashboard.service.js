class FavouriteDashboardService {
    constructor(DataProvider, DashboardFactory, AppEventsService, $q, CardCacheHelperService, Auth, DashboardCollection) {
        this.$q = $q;
        this.Auth = Auth;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.DashboardFactory = DashboardFactory;
        this.DashboardCollection = DashboardCollection;
        this.CardCacheHelperService = CardCacheHelperService;

        this.dashboard = null;
        this.loadPromise = null;

        // Clear everything on logout
        this.Auth.on('logout', () => this.unload());
    }

    load(useCache = true) {
        if(useCache && this.loadPromise) return this.loadPromise;

        this.loadPromise = this.DashboardCollection.api(useCache).then((response) => {
            let dashboard = null;
    
            // Get favourite dashboard from the list of all dashboards
            if(response.favouriteDashboardId) {
                dashboard = response.dashboards.find(dashboard => dashboard.id === response.favouriteDashboardId);
            }
    
            // We load dashboard only if it exists in the API
            if(dashboard) {
                dashboard.isFavourite = true;
                this.dashboard = this.DashboardFactory.create(dashboard, this.DataProvider);
            }
            
            return this.dashboard;
        }).catch(() => {
            this.loadPromise = null;
        });

        return this.loadPromise;
    }

    unload() {
        this.dashboard = null;
        this.loadPromise = null;
    }

    addCard(card) {
        return this.$q((resolve, reject) => {
            if (!this.dashboard || !card) {
                reject("Favourite dashboard id or card id is not a number!");
            } else {
                this.DataProvider.get("card/addFavouriteCard", {favouriteDashboardId: this.dashboard.id, cardId: card.id}, false)
                    .then(result => {
                        let positionId = result.cardPositionId;
    
                        this.AppEventsService.track('added-card-to-favourites', {id: card.id});
    
                        this.dashboard.cards.invalidate();
                        
                        resolve(positionId);
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        });
    }

    removeCard(cardId) {
        return this.$q((resolve, reject) => {
            if (!this.dashboard || !cardId) {
                reject("Favourite dashboard id or card id is not a number!");
            } else {
                this.DataProvider.get("card/deleteFavouriteCard", {favouriteDashboardId: this.dashboard.id, cardId: cardId}, false)
                    .then(result => {
                        this.CardCacheHelperService.remove(cardId, this.dashboard.id);

                        this.AppEventsService.track('removed-card-from-favourites', {id: cardId});

                        resolve(result);
                    })
                    .catch(error => {
                        reject(error);
                    });
            }
        });
    }

}

truedashApp.service('FavouriteDashboardService', FavouriteDashboardService);
