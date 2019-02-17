'use strict';

import {Config} from '../../config';

class DashboardsListCtrl {

    /**
     * @param {Auth} Auth
     * @param {DataProvider} DataProvider
     * @param {DeregisterService} DeregisterService
     * @param {DashboardCollection} DashboardCollection
     * @param {DashboardFolderService} DashboardFolderService
     */
    constructor(DashboardFolderService, DashboardCollection, DeregisterService, Auth, $q, DataProvider, $element, $window, $scope, $state) {
        this.$q = $q;
        this.Auth = Auth;
        this.$state = $state;
        this.$window = $window;
        this.$element = $element;
        this.DataProvider = DataProvider;
        this.DashboardCollection = DashboardCollection;
        this.watchers = DeregisterService.create($scope);
        this.DashboardFolderService = DashboardFolderService;

        this.loading = true;
        this.dashboards = [];
        this.folders = [];
        this.numberOfVisibleItems = 0;

        this.DashboardCollection.on('removed updated created copied', () => this.reload());
        this.DashboardFolderService.on('removed updated created copied', () => this.reload());
        this.watchers.watch('$ctrl.loading', () => this.resizeMenu());
        this.watchers.watch('$ctrl.DashboardCollection.getActiveDashboard()', (activeDashboard) => this.dashboard = activeDashboard);
        angular.element(this.$window).bind('resize', () => this.resizeMenu());

        this.initDashboardsAndFolders().then(() => this.checkForMobile());
    }

    isPhone() {
        return Config.isPhone;
    }
    
    get error() {
        return this.DashboardFolderService.error;
    }
    
    reload() {
        return this.initDashboardsAndFolders(false);
    }

    checkForMobile() {
        if(this.isPhone()) {
            this.numberOfVisibleItems = this.totalMenuItems;
            this.$element.find('.dashboard-menu').addClass('collapse');

            angular.element(this.$window).bind('click', (event) => {
                let element = angular.element(event.target);
                if(!this.$element.find(element).length && this.$element != element) {
                    this.$element.find('.dashboard-menu').removeClass('in');
                }
            });

            this.watchers.onRoot('$stateChangeStart', () => {
                this.$element.find('.dashboard-menu').removeClass('in');
            });
        }
    }

    get totalMenuItems() {
        return this.folders.length + this.getMenuDashboards().length;
    }

    initDashboardsAndFolders(useCache = true) {
        this.loading = true;

        return this.$q.all([this.DashboardCollection.load(), this.DashboardFolderService.load(useCache)]).then(([dashboards, folders]) => {
            this.DashboardFolderService.mergeFoldersAndDashboards();
            this.dashboard = this.DashboardCollection.getActiveDashboard();

            this.dashboards = _.clone(this.DashboardCollection.items);
            this.folders = this.filterActiveFolders(folders);
            this.loading = false;
        });
    }

    filterActiveFolders(folders) {
        if(folders === undefined) return [];

        return folders.filter(folder => {
            return folder.active && folder.getActiveDashboards().length;
        });
    }

    isFolderVisible(index) {
        let numberOfFolders = this.numberOfVisibleItems;

        return index < numberOfFolders;
    }

    isDashboardVisible(index) {
        let numberOfDashboards = this.numberOfVisibleItems;
        numberOfDashboards -= this.folders.length;

        return index < numberOfDashboards;
    }

    getMenuDashboards() {
        return this.dashboards.filter((dashboard) => {
            return !dashboard.inFolder && !dashboard.isFavourite;
        });
    }

    resizeMenu() {

        // We don't want to resize menu while dashboard list is loading or if it's mobile view
        if(this.loading || this.isPhone()) return;

        // We have to wrap this with timeout so page would update correctly
        this.watchers.timeout(() => {

            let dropdownWidth = 270;
            let availableSpace = this.$element.parents(".menu-wrapper").width() - dropdownWidth;

            let itemsWidth = 0;
            this.numberOfVisibleItems = 0;

            this.$element.find('.dashboard-menu').find('.menu-item').each((index, element) => {
                let width = this.getRealElementWidth($(element));

                // If item cannot fit we stop execution and show the menu
                if (availableSpace < itemsWidth + width) {
                    return false;
                }

                itemsWidth += width;
                this.numberOfVisibleItems++;

            });
        });
    }

    /**
     * We can't get width of hidden dropdown items so we use this trick where
     * we put it back into menu, get width and remove them afterwards
     */
    getRealElementWidth(element) {
        let clone = element.clone();
        clone.css("visibility", "hidden");
        this.$element.find('.dashboard-menu').append(clone);
        let width = clone.outerWidth();
        clone.remove();
        return width;
    }

    $onDestroy() {
        this.DashboardCollection.off(null, null, this);
    }
}

truedashApp.component('tuDashboardsList', {
    controller: DashboardsListCtrl,
    templateUrl: 'content/dashboard/dashboardsList/dashboardsList.html'
});
