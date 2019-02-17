'use strict';

import {Collection} from '../data/collection.js';

class DashboardUsers extends Collection {
    constructor(dashboard, DataProvider, UserService) {
        super();
        this.dashboard = dashboard;
        this.DataProvider = DataProvider;
        this.UserService = UserService;
    }

    load() {
        return this.DataProvider.get('dashboard/dashboardUsers/' + this.dashboard.id).then((usersList) => {
            usersList.forEach((user) => {
                this.addItem(this.UserService.create(user));
            });
            return this.items;
        });
    }

    invalidate() {
        this.DataProvider.clearCache('dashboard/dashboardUsers/' + this.dashboard.id, {}, 'GET');
    }

    share(users) {
        var shareObj = {
            users: users,
            dashboardId: this.dashboard.id
        };
        this.invalidate();
        return this.DataProvider.get('dashboard/share', shareObj, false);
    }

    unshare(users) {
        var unShareObj = {
            users: users,
            dashboardId: this.dashboard.id
        };
        this.invalidate();
        return this.DataProvider.get('dashboard/unshare', unShareObj, false);
    }

}

truedashApp.factory('DashboardUsersFactory', (DataProvider, UserService) => {
    return {
        create: (dashboard) => new DashboardUsers(dashboard, DataProvider, UserService)
    }
});
