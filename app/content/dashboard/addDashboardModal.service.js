'use strict';

class AddDashboardModalController {

    constructor($scope, $uibModalInstance, DashboardCollection, DashboardFolderService, Auth, toaster, $rootScope, $q) {
        this.$q = $q;
        this.Auth = Auth;
        this.$scope = $scope;
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.$uibModalInstance = $uibModalInstance;
        /** @type {DashboardCollection} */
        this.DashboardCollection = DashboardCollection;
        /** @type {DashboardFolderService} */
        this.DashboardFolderService = DashboardFolderService;

        this.loading = false;
        this.forms = [];
        this.dashboard = {
            useTimezone: false,
            timezone: this.Auth.user.timezone,
        };
        this.dashboardCollection = this.DashboardCollection;
    
        this.initiateFolders();
    }
    
    onUseTimezoneClick() {
        this.dashboard.useTimezone = !this.dashboard.useTimezone;
    }
    
    timezoneSentence() {
        let sentence = [
            `* This dashboard is using the user profile's specified timezone <strong>${this.Auth.user.timezoneString()}</strong>.`
        ];
        
        if(this.dashboard.useTimezone) {
            sentence[0] = `* This dashboard's timezone is set to <strong>${this.dashboard.timezone}</strong>.`;
            sentence[1] = 'This overrides timezone set at the <strong>user profile</strong> level.';
        }
        
        return sentence.join(' ');
    }

    create() {

        this.submitted = true;

        // Don't submit if form is invalid
        if (this.forms.dashboard_form.$invalid) return;

        this.loading = true;

        // Set default description if nothing is supplied
        if (!this.dashboard.description) this.dashboard.description = 'No description';
    
        this.dashboardCollection.create(this.dashboard).then(() => {
            this.$uibModalInstance.dismiss();
            this.toaster.success('Dashboard created');
        }).catch((error) => {
            this.toaster.error(error.message);
        }).finally(() => {
            this.loading = false;
        });
    }

    initiateFolders() {
        this.loading = true;

        this.DashboardFolderService.load().then((folders) => {
            this.folders = _.clone(folders);

            // Only admin users can add dashboards to organisation folders
            this.folders.items = this.Auth.user.isAdmin() ? this.folders.items : this.folders.items.filter((folder) => {
                return !folder.isOrganisationFolder();
            });

            this.loading = false;
        });
    }

    /**
     * Check if form field is dirty
     *
     * @param field
     * @returns boolean
     */
    dirty(field) {
        return this.submitted || field.$dirty;
    }
}

class AddDashboardModalService {
    constructor($uibModal) {
        this.$uibModal = $uibModal;
        this.modalInstance = null;
    }

    open() {

        // If there is already modal active we need to close it before opening new one
        this.modalInstance && this.modalInstance.dismiss();

        this.modalInstance = this.$uibModal.open({
            controller: AddDashboardModalController,
            templateUrl: 'content/dashboard/add.html',
            bindToController: true,
            controllerAs: 'adm',
            size: 'md'
        });
    }
}

truedashApp.service('AddDashboardModalService', AddDashboardModalService);
