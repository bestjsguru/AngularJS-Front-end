class CardFullInfoLoadingService {

    constructor($q) {
        this.$q = $q;

        this.promiseList = {
            dashboards: {},
            cards: {}
        };
    }

    /**
     * @param {DashboardCollection} collection
     */
    set collection(collection){
        this.DashboardCollection = collection;
    }

    /**
     * @param {DashboardModel} dashboard
     * @param {Promise} promise
     */
    setDashboard(dashboard, promise){
        this.promiseList.dashboards[dashboard.id] = promise;
    }

    /**
     * @param {DashboardModel} dashboard
     */
    removeDashboard(dashboard){
        delete this.promiseList.dashboards[dashboard.id];
    }

    check(card){
        const dash = this.DashboardCollection.findByCard(card);

        return this.promiseList.dashboards[dash.id] || this.$q.reject(`card-info cache haven't been loaded with dashboard`);
    }
}

truedashApp.service('CardFullInfoLoadingService', CardFullInfoLoadingService);
