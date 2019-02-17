'use strict';

import './dashboardExport/dashboardExport.component';

let Visibility = require('visibilityjs');

class DashboardsPageCtrl {

    constructor($rootScope, $scope, $state, $element, DashboardCollection, $confirm, DashboardFolderService, $q, DataProvider,
                AppEventsService, DeregisterService, Auth, DataExportService, toaster, DashboardReportService, DashboardFiltersService,
                UserService, $uibModal) {

        this.$q = $q;
        this.Auth = Auth;
        this.$scope = $scope;
        this.$state = $state;
        this.toaster = toaster;
        this.$confirm = $confirm;
        this.$element = $element;
        this.$uibModal = $uibModal;
        this.$rootScope = $rootScope;
        this.UserService = UserService;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.DeregisterService = DeregisterService;
        this.DataExportService = DataExportService;
        this.DashboardCollection = DashboardCollection;
        this.DashboardFolderService = DashboardFolderService;
        this.DashboardReportService = DashboardReportService;
        this.dashboardFiltersService = DashboardFiltersService;

        this.init();
    }

    get isExport() {
        return window.Location.isExport;
    }

    get isPrintable() {
        return window.Location.isPrintable;
    }

    get isPPT() {
        return window.Location.isPPT;
    }

    $postLink() {
        this.watchers.watch('$ctrl.loading', loading => {
            if(!loading) {
                // remove class from wrapper div. This class is needed for exporting to work
                this.$element.parents('.chart-loading').removeClass('chart-loading');
            }
        });
    }

    init() {
        this.watchers = this.DeregisterService.create(this.$scope);
        this.dateRange = 'Update Date Range';

        this.export = this.DataExportService.getStatus();

        this.cardsLoading = true;
        this.dashboardLoading = true;
        this.folder = null;
        this.dashboard = null;
        this.owner = null;
        this.currentDashboardFilters = [];
        this.currentDashId = this.$state.params.dashboardId;
        this.pagePermissions = null;

        // Prevent rendering of dashboard unless app is in active browser tab
        // as soon as we activate tab dashboard and cards will be rendered
        Visibility.onVisible(() => {
            this.bindWatchers();
            this.loadDashboardsAndFolders();
        });
    }

    showLoader() {
        return this.dashboardLoading || (!this.dashboard.cards.loaded && !this.dashboard.cards.length);
    }

    get loading() {
        return this.dashboardLoading || this.cardsLoading;
    }

    get hasFolderName() {
        return this.folder && !this.isExport && !this.Auth.user.isExternal();
    }

    bindWatchers() {
        this.watchers.onRoot('$stateChangeStart', (event, toState, toParams, fromState, fromParams) => {
            if (toParams.dashboardId !== undefined) {
                this.currentDashId = toParams.dashboardId;
                this.DashboardCollection.setActiveDashboard(this.currentDashId);
                this.dashboard = this.DashboardCollection.getById(this.currentDashId);
            }
        });

        this.watchers.watch('$ctrl.dashboard', () => {
            this.dashboard && this.loadOwnerDetails();
        });

        // When dashboard is removed we redirect to default dashboard if we are on dashboards page
        this.DashboardCollection.on('removed', () => {
            this.$state.is('dashboard') && this.redirectToFirstDashboard();
        });

        // Reload dashboard owner info if the dashboard ownership transfered to another user
        this.DashboardCollection.on('loaded', () => {
            if(!this.dashboard) return;
            
            this.loadOwnerDetails();
            this.pagePermissions = this.getPagePermissions();
        });
    }

    loadDashboardsAndFolders() {
        // Load all dashboards and folders in order to merge them and display nicely
        let promises = [this.DashboardFolderService.load(), this.DashboardCollection.load()];

        this.$q.all(promises).then(([folders, dashboardItems]) => {
            this.dashboards = dashboardItems;
            this.DashboardFolderService.mergeFoldersAndDashboards();

            this.DashboardCollection.setActiveDashboard(this.currentDashId);
            this.dashboard = this.DashboardCollection.getById(this.currentDashId);

            // Redirect to first dashboard if there is no active dashboard. For example when dashboard ID don't exist
            if(this.$state.is('dashboard') && (!this.dashboard || !this.$state.params.dashboardId)) {
                this.redirectToFirstDashboard(); return;
            }

            let promises = [];
            if (this.dashboard) {
                this.pagePermissions = this.getPagePermissions();
                if(!this.isDashboardVisible(this.dashboard, folders)) {
                    this.toaster.info('Dashboard you are trying to access is inactive.');
                    this.redirectToFirstDashboard(); return;
                }

                if (this.dashboard.inFolder) {
                    this.folder = folders.find(folder => folder.id == this.dashboard.inFolder);
                }

                promises.push(this.trackCardsLoading(true));
            }

            this.dashboardLoading = false;

            return this.$q.all(promises);
        });
    }

    getPagePermissions() {
        const canDragOrResizeCard = this.dashboard.isOwner();
        const canEditCard = this.dashboard.isOwner() || this.Auth.user.isAdmin();
        const canHideCard = this.dashboard.isOwner();
        const canDeleteCard = this.dashboard.isOwner();

        return {
            canDragOrResizeCard,
            canEditCard,
            canHideCard,
            canDeleteCard
        };
    }

    isDashboardVisible(dashboard, folders) {
        let folder = {active: true};

        if (dashboard.inFolder) {
            folder = folders.find(folder => folder.id == dashboard.inFolder);
        }

        return dashboard.isActive() && folder.active;
    }

    showSubHeader() {
        return !this.dashboardLoading;
    }

    redirectToFirstDashboard() {
        //if there are no dashboards we will redirect to homepage
        if(!this.DashboardCollection.length) {
            this.$state.go('home'); return;
        }

        let defaultDashboard = this.DashboardFolderService.dashboardFolders.getDefaultDashboard();

        if(!defaultDashboard) {
            defaultDashboard = this.DashboardCollection.get(0);
        }

        defaultDashboard && this.$state.go('dashboard', {dashboardId: defaultDashboard.id});
    }

    trackCardsLoading(withInfo = false) {
        this.cardsLoading = true;
        return this.dashboard.trackCardsLoading(withInfo).finally(() => this.cardsLoading = false);
    }

    getDashboardStyle(dashboard) {
        // This part here is trying to fix issue where PhantomJS is rendering elements that have
        // 'ng-hide' class as visible, so we have to set visibility to hidden manually
        return window.Location.isPhantom && this.currentDashId != dashboard.id ? {display: 'none'} : {};
    }

    isCurrentDashboard(dashboard) {
        return this.currentDashId == dashboard.id;
    }
    
    exportDashboard() {
        this.$uibModal.open({
            size: 'md',
            component: 'appDashboardExport',
            resolve: {
                dashboard: () => this.dashboard,
                availableDashboardFilters: () => this.availableDashboardFilters,
            }
        });
    }

    refreshCards() {
        if (this.loading) return;
        
        this.AppEventsService.track('clicked-refresh-dashboard-cards', {dashboard_id: this.dashboard.id});
    
        this.dashboard.cards.invalidate();
        this.dashboard.trackCardsLoading(false).then(() => {
            this.$rootScope.$emit('dashboard.restoreOriginalCardData');
        });
    }

    showNewCardButton() {
        return !this.dashboard.isLocked() && !this.dashboard.reachedCardsLimit && this.dashboard.isOwner();
    }

    showEditDashboardButton() {
        return !this.dashboard.isLocked() && (this.Auth.user.isAdmin() || this.dashboard.isOwner());
    }

    openShareDashboardDialog() {
        this.DashboardReportService.openShareDashboardDialog();
    }

    isReportMenuDisabled() {
        return this.loading || this.dashboard.cards.length === 0;
    }

    openAddDashboardFilterModal() {
        this.dashboardFiltersService.openModal(undefined, this.currentDashboardFilters, this.currentDateFilter);
    }

    $onDestroy() {
        this.DashboardCollection.deactivateDashboards();
        this.DashboardCollection.off(null, null, this);
    }

    loadOwnerDetails() {
        this.owner = null;

        this.UserService.retreiveUserDetails(this.dashboard.createdBy).then((user) => {
            this.owner = this.UserService.create(user);
        }).catch(angular.noop);
    }
}

truedashApp.component('tuDashboardsPage', {
    controller: DashboardsPageCtrl,
    templateUrl: 'content/dashboard/dashboardsPage.html'
});
