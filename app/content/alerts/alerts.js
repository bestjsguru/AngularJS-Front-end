'use strict';

import {AlertsCollection} from './alerts.collection';

class Alerts extends AlertsCollection {
    constructor(card, $injector, DataProvider, AppEventsService, Auth) {
        super($injector);

        this.card = card;
        this.Auth = Auth;
        this.$injector = $injector;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
    }

    create(alertData) {
        if(!this.card) throw new Error("Cannot create alert without card object");

        var serverData = {
            card: this.card.id,
            createUserName: this.Auth.user.username
        };

        angular.extend(serverData, alertData);

        return this.DataProvider.post('alert/create', serverData).then(response => {

            if (response.failure) {
                throw response.failure;
            }

            this.invalidate();
            let alert = this.add(response, this.card);
            this.invalidateAlertInfo(alert);

            this.AppEventsService.track('created-alert', {id: alert.id});

            return alert;
        }).catch((error) => {
            throw new Error("Cannot Create the Card's Alert, error: " + error);
        });
    }

    update(alert, alertData) {
        let serverData = alert.getData();
        angular.extend(serverData, alertData);

        return this.DataProvider.post('alert/update', serverData).then(() => {
            this.invalidateAlertInfo(alert);
            alert.setData(serverData);

            this.AppEventsService.track('updated-alert', {id: alert.id});

            return this;
        }).catch((message) => {
            console.error("Cannot Create the Card's Alert", message);
            return message;
        });
    }

    loadMetric(alert) {
        return this.DataProvider.get(`alert/loadMetric/${alert.id}`);
    }

    load(useCache = true) {
        return this.card ? this.loadByCard(useCache) : this.loadAll(useCache);
    }

    loadByCard(useCache = true) {
        return this.DataProvider.get('alert/alertsByCard/' + this.card.id, {}, useCache).then(response => {
            if (response.failure) {
                throw response.failure;
            }

            return this.init(response);
        }).catch((error) => {
            throw new Error("Cannot Get the Card's Alerts, error: " + error);
        });
    }

    loadAll(useCache = true) {
        let params = {email: this.Auth.user.username, returnAll: true};

        return this.DataProvider.get('alert/alertsByUser', params, useCache).then((response) => {
            return this.init(response);
        }).catch((error) => {
            throw new Error("Cannot Get the Card's Alerts, error: " + error);
        });
    }

    init(response) {
        this.clear();

        response.forEach(item => this.add(item, this.card));

        return this.items;
    }

    remove(alert) {
        return this.DataProvider.get('alert/delete/' + alert.id, null, false).then((response) => {
            this.removeItem(alert);
            this.invalidateLoadSubscribers(alert);

            this.AppEventsService.track('deleted-alert', {id: alert.id});

            return response;
        }).catch((message) => {
            console.error("Cannot remove card alert", message);
        }).finally(() => {
            this.invalidateAlertInfo(alert);
        });
    }

    invalidateAlertInfo(alert) {
        // Get DashboardCollection like this in order to break circular dependency
        let DashboardCollection = this.$injector.get('DashboardCollection');

        DashboardCollection.loadByCardId(alert.cardId).then(() => {
            return DashboardCollection.findCard(alert.cardId);
        }).then((card) => {
            card.invalidateFullInfo();
            this.invalidate(alert.cardId);
        });
    }

    invalidateLoadSubscribers(alert) {
        this.DataProvider.clearCache('alertSubscription/subscriptionsByAlert/' + alert.id, {}, 'GET');
    }

    invalidate(id) {
        this.DataProvider.clearCache('alert/alertsByUser', {email: this.Auth.user.username, returnAll: true}, 'GET');
        this.DataProvider.clearCache('alert/alertsByCard/' + (id || this.card.id), {}, 'GET');
    }
}

truedashApp.service('AlertsFactory', ($injector, DataProvider, AppEventsService, Auth) => ({
    create: (card) => {
        return new Alerts(card, $injector, DataProvider, AppEventsService, Auth);
    }
}));
