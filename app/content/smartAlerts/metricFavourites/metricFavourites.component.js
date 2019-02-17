'use strict';

import './metricFavourites';

class MetricFavouritesCtrl {
    constructor(MetricFavouritesFactory, SmartAlertsService) {
        this.SmartAlertsService = SmartAlertsService;
        this.MetricFavouritesFactory = MetricFavouritesFactory;

        this.collapsed = true;
        this.visibleUsersLength = 1;
    }

    $onInit() {
        this.SmartAlertsService.favourites(this.card.id).then((favourites) => {
            this.card.favourites = this.MetricFavouritesFactory.create(favourites);
        });
    }

    getUsers() {
        if(!this.collapsed) {
            return this.card.favourites.items;
        }

        return this.card.favourites.items.slice(0, this.visibleUsersLength);
    }

    toggleFavourite() {
        let action = this.card.favourites.hasCurrentUser() ? 'unfavourite' : 'favourite';

        this.SmartAlertsService[action](this.card.id).then((favourites) => {
            this.card.favourites = this.MetricFavouritesFactory.create(favourites);
        });
    }

    getDirectionClass() {
        return {
            'pull-left': this.heartPosition === 'left',
            'pull-right': this.heartPosition === 'right',
            'text-danger': this.card.favourites.hasCurrentUser()
        };
    }

    get hiddenUsersLength() {
        return Math.max(0, this.card.favourites.items.length - this.visibleUsersLength);
    }

    toggleHiddenUsers() {
        this.collapsed = !this.collapsed;
    }
}

truedashApp.component('appMetricFavourites', {
    controller: MetricFavouritesCtrl,
    templateUrl: 'content/smartAlerts/metricFavourites/metricFavourites.html',
    bindings: {
        card: '=',
        heartPosition: '@',
    }
});
