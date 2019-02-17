'use strict';

class FavouriteCardsCtrl {

    constructor($rootScope, FavouriteDashboardService, DeregisterService, $scope, $element) {
        this.FavouriteDashboardService = FavouriteDashboardService;
        this.$rootScope = $rootScope;
        this.watchers = DeregisterService.create($scope);
        this.$element = $element;

        this.dashboard = null;
        this.dashboardLoading = false;
        this.cardsLoading = false;
        this.dashboardPermissions = null;
    }

    $postLink() {
        this.watchers.watch('$ctrl.loading', loading => {
            if(!loading) {
                // remove class from wrapper div. This class is needed for exporting to work
                this.$element.parents('.chart-loading').removeClass('chart-loading');
            }
        });
    }
    
    get isExport() {
        return window.Location.isExport;
    }

    $onInit() {
        this.dashboard = null;

        this.dashboardPermissions = {
            canDragOrResizeCard: true,
            canEditCard: false,
            canHideCard: false,
            canDeleteCard: false
        };

        this.dashboardLoading = true;
        this.FavouriteDashboardService.load().then(dashboard => {
            this.dashboardLoading = false;

            this.dashboard = dashboard;

            return this.loadCardsData(true);
        }).finally(() => {
            this.dashboardLoading = false;
        });
    }

    get loading() {
        return this.dashboardLoading || this.cardsLoading;
    }

    loadCardsData(withInfo = false) {
        this.cardsLoading = true;
        this.dashboard.trackCardsLoading(withInfo).finally(() => this.cardsLoading = false);
    }

    refreshCards() {
        if (this.loading) return;

        this.$rootScope.$emit('dashboard.restoreOriginalCardData');
    }

    hasCards() {
        return this.dashboard && this.dashboard.cards.getActive().length;
    }
}

truedashApp.component('appFavouriteCards', {
    controller: FavouriteCardsCtrl,
    templateUrl: 'content/home/favouriteCards/favouriteCards.html',
});
