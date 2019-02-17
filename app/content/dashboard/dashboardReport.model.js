'use strict';

import {EventEmitter} from '../system/events.js';

export class DashboardReport extends EventEmitter {

    constructor(data, dependencies = false) {
        super();

        this.id = data.report.id;
        this.dateTime = moment(data.report.dateTime);
        this.frequency = data.report.alertFrequency.name;
        this.card = data.report.card || null;
        this.cardIds = _.isArray(data.report.cardIds) ? data.report.cardIds : null;
        this.snapshot = _.isBoolean(data.report.snapshot) ? data.report.snapshot : true;
        this.dashboardId = data.report.dashboard.id;

        if (data.report.reportType && data.report.reportType.name) {
            this.reportType = data.report.reportType.name;
        } else {
            this.reportType = data.report.reportType || 'pdf';
        }

        this.subject = data.report.subject || '';
        this.text = data.report.text || '';
        this.subscriptionId = data.id;
        this.customInterval = data.report.customInterval;
        this.alertFrequency = data.report.alertFrequency;

        if (!dependencies) return;

        this.Auth = dependencies.Auth;
        this.UserService = dependencies.UserService;
        this.DashboardCollection = dependencies.DashboardCollection;

        // TODO: Have BE return same response when we create report (report/create) as when we list them
        // When we create report we are not getting back list of users, and we have to manually set users array
        if(!data.users) {
            data.users = data.report.users;
        }

        this.users = data.users.map((user) => this.UserService.create(user));
        this.owner = this.UserService.create(data.owner);

        this.DashboardCollection.load().then(() => {
            this.dashboard = this.DashboardCollection.getById(this.dashboardId);
        });
    }

    get subscribed() {
        return this.users.findIndex((user) => user.id === this.Auth.user.id) >= 0;
    }
}

truedashApp.value('DashboardReport', DashboardReport);



