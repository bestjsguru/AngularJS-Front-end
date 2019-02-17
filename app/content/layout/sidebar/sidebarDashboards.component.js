'use strict';

class SidebarDashboardsCtrl {

    /**
     * @param {DataProvider} DataProvider
     * @param {DeregisterService} DeregisterService
     * @param {DashboardCollection} DashboardCollection
     * @param {DashboardFolderService} DashboardFolderService
     */
    constructor(DashboardFolderService, DashboardCollection, DeregisterService, $q, DataProvider, $scope, $state, Auth, $document, $element) {
        this.$q = $q;
        this.$state = $state;
        this.$element = $element;
        this.$document = $document;
        this.DataProvider = DataProvider;
        this.DashboardCollection = DashboardCollection;
        this.watchers = DeregisterService.create($scope);
        this.DashboardFolderService = DashboardFolderService;

        this.loading = true;
        this.dashboards = [];
        this.folders = [];
        this.isVisible = false;
    
        // External users dont have home page so we will block any access to home page here
        this.hasSidebarDashboards = !Auth.user.isExternal();

        this.DashboardCollection.on('removed updated created copied', () => this.reload());
        this.DashboardFolderService.on('removed updated created copied', () => this.reload());
        this.watchers.watch('$ctrl.DashboardCollection.getActiveDashboard()', (activeDashboard) => this.dashboard = activeDashboard);
        
        this.closeOnClick();
    }
    
    $onInit() {
        this.initDashboardsAndFolders();
    }
    
    get error() {
        return this.DashboardFolderService.error;
    }
    
    reload() {
        return this.initDashboardsAndFolders(false);
    }

    initDashboardsAndFolders(useCache = true) {
        this.loading = true;

        return this.$q.all([this.DashboardCollection.load(), this.DashboardFolderService.load(useCache)]).then(([dashboards, folders]) => {
            this.DashboardFolderService.mergeFoldersAndDashboards();
    
            // We have to wrap this with timeout so page would update correctly
            return this.watchers.timeout(() => {
                this.dashboard = this.DashboardCollection.getActiveDashboard();
    
                this.dashboards = _.clone(this.DashboardCollection.items);
                this.folders = this.filterActiveFolders(folders);
                this.loading = false;
            });
        });
    }

    filterActiveFolders(folders) {
        if(folders === undefined) return [];

        return folders.filter(folder => {
            return folder.active && folder.getActiveDashboards().length;
        });
    }

    getMenuDashboards() {
        return this.dashboards.filter((dashboard) => {
            return !dashboard.inFolder && !dashboard.isFavourite;
        });
    }
    
    isOnDashboardPage() {
        return this.$state.is('dashboard');
    }
    
    closeOnClick() {
        // Hide menu when clicked on any dropdown on page because
        // dropdowns will prevent regular click event from happening
        this.$document.on('show.bs.dropdown', () => {
            this.isVisible && this.hide();
        });
        
        // Hide menu when clicked outside of it anywhere on page
        this.$document.bind('click', (event) => {
            if(!this.isVisible) return;
        
            let element = angular.element(event.target);
            let clickedOutside = this.$element.find(event.target).length === 0;
            let clickedOnDashboardLink = element.hasClass('dashboard-link') || element.parents('.dashboard-link').length > 0;

            let shouldBeClosed = clickedOutside || clickedOnDashboardLink;

            shouldBeClosed && this.hide();
        });
    }
    
    toggle() {
        this.isVisible ? this.hide() : this.show();
    }
    
    hide() {
        this.watchers.timeout(() => this.isVisible = false);
    }
    
    show() {
        this.watchers.timeout(() => this.isVisible = true);
    }

    $onDestroy() {
        this.DashboardCollection.off(null, null, this);
    }
}

truedashApp.component('appSidebarDashboards', {
    controller: SidebarDashboardsCtrl,
    templateUrl: 'content/layout/sidebar/sidebarDashboards.html'
});
