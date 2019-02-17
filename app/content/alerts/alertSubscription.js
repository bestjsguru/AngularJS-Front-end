'use strict';

class AlertSubscription {
    constructor(alert, DataProvider, AppEventsService, Auth, $q, toaster) {
        this.$q = $q;
        this.alert = alert;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.Auth = Auth;
        this.toaster = toaster;
    }

    load(useCache = true) {
        return this.DataProvider.get('alertSubscription/subscriptionsByAlert/' + this.alert.id, {}, useCache).then((response) => {
            this.alert.alertSubscription = this.alert.convertAlertSubscription(response);

            return response;

        }).catch((message) => {
            console.error("Cannot get subscriber list", message);
        });
    }

    subscribeCurrentUser() {
        return this.isUserSubscribed(this.Auth.user) ? this.$q.when(true) : this.subscribe(this.Auth.user);
    }

    isUserSubscribed(user) {
        return this.alert.alertSubscription.find(subscription => subscription.user.id === user.id);
    }

    get subscribed() {
        return !! this.getMySubscription();
    }

    getMySubscription() {
        if (this.Auth.isLoggedIn()) {
            return this.isUserSubscribed(this.Auth.user) || false;
        }

        return false;
    }

    subscribe(user) {
        var data = {
            id: this.alert.id,
            users: [user.email]
        };

        return this.DataProvider.get('alertSubscription/subscribe', data, false).then(response => {
            this.AppEventsService.track('subscribed-to-alert', {
                id: data.id,
                emails: data.users.join(', ')
            });

            this.invalidateLoadSubscribers();

            return this.addSubscriber(response);
        }).catch((message) => {
            console.error("Cannot subscribe to a card alert", message);
        });
    }

    addSubscriber(data) {
        let subscription = this.isUserSubscribed(this.Auth.user);

        if(subscription) return subscription;

        this.alert.alertSubscription.push({
            id: data[this.Auth.user.email],
            user: this.Auth.user
        });
    }

    removeSubscriber(subscription) {
        this.alert.alertSubscription = this.alert.alertSubscription.filter(item => item.id !== subscription.id);
    }

    toggle() {
        let subscription = this.isUserSubscribed(this.Auth.user);
        if(subscription) {
            if(this.alert.isOwnAlert()) {
                this.toaster.info('You can\'t unsubscribe from alerts you created.');
            } else {
                this.unsubscribe(subscription);
            }
        } else {
            this.subscribe(this.Auth.user);
        }
    }

    unsubscribe(subscription) {
        let data = {
            subscriptions: [subscription.id]
        };

        return this.DataProvider.get('alertSubscription/unsubscribe', data, false).then(() => {
            this.invalidateLoadSubscribers();

            this.AppEventsService.track('unsubscribed-from-alert', {
                id: this.alert.id,
                emails: [subscription.user.email].join(', ')
            });

            return this.removeSubscriber(subscription);
        }).catch((message) => {
            console.error('Cannot unsubscribe from a card alert', message);
        });
    }

    invalidateLoadSubscribers() {
        this.DataProvider.clearCache('alertSubscription/subscriptionsByAlert/' + this.alert.id, {}, 'GET');
    }
}

truedashApp.service('AlertSubscriptionFactory', (DataProvider, AppEventsService, Auth, $q, toaster) => ({
    create: (alert) => {
        return new AlertSubscription(alert, DataProvider, AppEventsService, Auth, $q, toaster);
    }
}));
