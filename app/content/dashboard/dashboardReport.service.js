'use strict';

import './dashboardReport.model';
import {ShareDashboardModalOptions} from './../dashboard/shareDashboardModal/shareDashboardModal';

class DashboardReportService {

    constructor($rootScope, $uibModal, toaster, DataProvider, DashboardReport, AppEventsService, UserService, DashboardCollection, Auth) {
        this.$rootScope = $rootScope;
        this.$uibModal = $uibModal;
        this.toaster = toaster;
        this.Auth = Auth;
        this.UserService = UserService;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.DashboardReport = DashboardReport;
        this.DashboardCollection = DashboardCollection;
    }

    save(dashboardReportParams) {
        return this.DataProvider.post('report/create', dashboardReportParams).then((data) => {
            this.invalidateGetByUser();

            this.AppEventsService.track('created-email-report', {id: data.report.id});

            return this.create(data);
        });
    }

    share(shareDashboardParams) {
        return this.DataProvider.post('dashboard/shareDashboard', shareDashboardParams);
    }

    openShareDashboardDialog() {
        this.modalInstanceInviteUserDialog && this.modalInstanceInviteUserDialog.dismiss();

        this.modalInstanceInviteUserDialog = this.$uibModal.open(ShareDashboardModalOptions);

        this.modalInstanceInviteUserDialog.result
            .then(result => {
                const dashboard = this.DashboardCollection.getActiveDashboard();
                const model = {
                    email: result.email,
                    authority: 'ROLE_EXTERNAL_USER',
                    message: result.message,
                    dashboardIds: [dashboard.id],
                    // folderIds: [dashboard.inFolder]
                };

                this.inviteUserToDashboardNow(model);
            });
    }

    inviteUser(shareUserToDashboardParams) {
        return this.DataProvider.post('user/inviteUser', shareUserToDashboardParams);
    }

    update(dashboardReportParams) {
        return this.DataProvider.post('report/update', dashboardReportParams).then(() => {
            this.invalidateGetByUser();

            this.AppEventsService.track('updated-email-report', {id: dashboardReportParams.id});
        });
    }

    create(data) {
        return new this.DashboardReport(data, {DashboardCollection: this.DashboardCollection, UserService: this.UserService, Auth: this.Auth});
    }

    createReportNow(data) {
        this.$rootScope.$emit('dashboard.exportStart', {message: 'Creating email report'});
        this.save(data).then(() => {
            this.toaster.success('Email report has been created.');
        }).catch(() => {
            this.toaster.error('Email report could not be created.');
        }).finally(() => {
            this.$rootScope.$emit('dashboard.exportEnd');
        });
    }

    inviteUserToDashboardNow(data) {
        this.$rootScope.$emit('dashboard.exportStart', {message: 'Inviting user to dashboard'});
        this.inviteUser(data).then(() => {
            this.toaster.success('Invite has been created.');
        }).catch(() => {
            this.toaster.error('Invite could not be created.');
        }).finally(() => {
            this.$rootScope.$emit('dashboard.exportEnd');
        });
    }

    shareLinkNow(data) {
        this.$rootScope.$emit('dashboard.exportStart', {message: 'Sharing dashboard by email'});
        this.share(data).then(() => {
            this.toaster.success('Email report has been created.');
        }).catch(() => {
            this.toaster.error('Email report could not be created.');
        }).finally(() => {
            this.$rootScope.$emit('dashboard.exportEnd');
        });
    }



    remove(dashboardReportId) {
        return this.DataProvider.get('report/delete/' + dashboardReportId, {}, false).then(() => {
            this.invalidateGetByUser();

            this.AppEventsService.track('deleted-email-report', {id: dashboardReportId});
        });
    }

    subscribeUser(reportId, username) {
        if (!_.isArray(username)) username = [username];
        
        let data = {
            users: username,
            id: reportId
        };
        return this.DataProvider.get('reportSubscription/subscribe', data, false);
    }

    unsubscribeUser(reportId) {
        return this.DataProvider.get('reportSubscription/unSubscribe/' + reportId, {}, false);
    }

    getByUser(useCache = true) {
        return this.DataProvider.get('reportSubscription/list', {}, useCache).then((reports) => {
            return reports.map(report => this.create(report));
        });
    }

    invalidateGetByUser() {
        this.DataProvider.clearCache('reportSubscription/list', {}, 'GET');
    }

    /**
     * Check if Report is owned by the currently logged in user
     * @return {Boolean}
     */
    isOwn(Auth, report) {
        // Auth will be injected in each function call because we are calling this method from html templates
        // See ProfileReportsCtrl for reference
        return Auth.isLoggedIn() && report.owner.username === Auth.user.username;
    }
}

truedashApp.service('DashboardReportService', DashboardReportService);
