'use strict';

import {EventEmitter} from '../../system/events.js';

class DashboardFolderModel extends EventEmitter {
    constructor(data, UserService, DashboardFactory, Auth) {
        super();
        this.Auth = Auth;
        this.UserService = UserService;
        this.DashboardFactory = DashboardFactory;

        data = data || {};
        this.init(data);
    }

    init(data) {
        this.id = data.id;
        this.createdBy = data.createdBy;
        this.title = data.title;
        this.description = data.description;
        this.position = data.position;
        this.active = _.get(data, 'active', true);
        this.dashboards = data.dashboards ? data.dashboards.map(dashboard => this.DashboardFactory.create(dashboard)) : [];
        this.activeDashboards = this.dashboards.filter(dashboard => dashboard.active);
        this.users = data.users ? data.users.map(user => this.UserService.create(user)) : [];
        this.organisation = data.organisation;
    }

    reset() {
        this.init({});
    }

    hasDashboards() {
        return this.dashboards && this.dashboards.length > 0;
    }

    getActiveDashboards() {
        return this.activeDashboards;
    }

    isOrganisationFolder() {
        return !this.users.length && this.organisation ? true : false;
    }

    isLocked() {
        return this.isOrganisationFolder() && !this.Auth.user.isAdmin();
    }

    isOwnedByCurrentUser() {
        return this.createdBy === this.Auth.user.email;
    }

    hasDashboard(dashboardId) {
        dashboardId = parseInt(dashboardId);

        return !!this.dashboards.find(item => item.id === dashboardId);
    }

    update(data) {
        if (data && data.length) {
            data.forEach((field) => this[field] = data[field]);
        }

        return this;
    }

    getRequestData(saveFields) {
        let data = {
            title: this.title,
            description: this.description,
            position: this.position,
            active: this.active
        };

        // We only add organisation if it exists
        if (this.organisation) data.organisation = this.organisation.id;

        if (saveFields && saveFields.length) {
            data = {};
            saveFields.forEach((field) => {
                data[field] = this[field];
            });
        }

        return data;
    }

    removeDashById(dashId) {
        this.dashboards.forEach((dashboard, index) => {
            // If we have a match
            if (dashboard.id === dashId) {
                // Remove that dashboard from the list of dashboards
                this.dashboards.splice(index, 1);
            }
        });
    }
}

truedashApp.value('DashboardFolderModel', DashboardFolderModel);



