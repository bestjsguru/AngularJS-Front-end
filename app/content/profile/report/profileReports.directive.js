'use strict';

import {EmailReportSentenceGenerator} from '../../dashboard/emailReport/emailReportSentenceGenerator';
import {ArrayHelper} from '../../system/arrayHelper.js';

class ProfileReportsCtrl {

    constructor($scope, DashboardReportService, Auth, toaster, DeregisterService, AppEventsService) {
        this.toaster = toaster;
        this.AppEventsService = AppEventsService;
        this.DashboardReportService = DashboardReportService;
        this.watchers = DeregisterService.create($scope);

        this.loading = true;
        this.searchQuery = '';
        this.user = Auth.user;
        this.reports = [];
        this.isOwn = (report) => this.DashboardReportService.isOwn(Auth, report);
    
        this.listLoading = false;

        this.watchers.onRoot('emailReport.updated emailReport.created', () => this.initReportsList());

        this.show = {
            my: false,
            all: true,
            setTo: (type) => {
                this.show.my = this.show.all = false;
                this.show[type] = true;
                this.refreshReportsList();
            }
        };

        this.initReportsList();

        this.AppEventsService.track('visited-reports-page');
    }
    
    canEdit(report) {
        return this.isOwn(report) || this.user.hasPermission('email-reports-management');
    }

    refreshReportsList() {
        this.reports = this.show.all ? _.clone(this.allReports) : this.allReports.filter((report) => this.isOwn(report));
    }

    getReportsFromServer() {
        return this.DashboardReportService.getByUser(false).then((reports) => {
            this.allReports = reports;
            this.refreshReportsList();
        });
    }

    initReportsList() {
        this.loading = true;
        this.getReportsFromServer().then(() => this.loading = false);
    }

    refreshList() {
        this.listLoading = true;
        this.getReportsFromServer().then(() => this.listLoading = false);
    }

    removeReport(report) {
        this.loading = true;
        this.DashboardReportService.remove(report.id).then(() => {
            this.reports = ArrayHelper.without(this.reports, report.id, 'id', true);
            this.allReports = ArrayHelper.without(this.allReports, report.id, 'id', true);
            this.toaster.success('Report deleted');
        }).finally(() => this.loading = false);
    }

    getFrequencySentence(report) {
        let generator = new EmailReportSentenceGenerator(report.dashboard, report.card, report);
        return generator.get(true);
    }

    toggleFollow (report) {
        return report.subscribed ? this.unFollow(report) : this.follow(report);
    }

    follow(report) {
        this.DashboardReportService.subscribeUser(report.id, this.user.username).then(()=>{
            report.users.push(this.user);
            this.toaster.success('Subscription created.');
        });
    }

    unFollow(report) {
        this.DashboardReportService.unsubscribeUser(report.id).then(()=>{
            report.users = report.users.filter(user => user.id !== this.user.id);
            this.toaster.success('Subscription deleted');
        });
    }
}

truedashApp.directive('tuProfileReports', () => ({
    templateUrl: 'content/profile/report/report.html',
    restrict: 'E',
    controllerAs: 'reports',
    bindToController: true,
    controller: ProfileReportsCtrl
}));
