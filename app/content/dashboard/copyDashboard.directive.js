'use strict';

class CopyDashboardModalController {

    /**
     * @param {DashboardCollection} DashboardCollection
     * @param {toaster} toaster
     * @param {Auth} Auth
     * @param {CardCacheHelperService} CardCacheHelperService
     */
    constructor(folders, DashboardCollection, $uibModalInstance, toaster, Auth, $state, CardCacheHelperService) {
        this.Auth = Auth;
        this.$state = $state;
        this.toaster = toaster;
        this.$uibModalInstance = $uibModalInstance;
        this.DashboardCollection = DashboardCollection;
        this.CardCacheHelperService = CardCacheHelperService;
        this.folders = _.clone(folders);
        this.currentDashboard = this.DashboardCollection.getActiveDashboard();

        if (this.folders && this.folders.items.length > 0) {
            // Only admin users can clone dashboards to organisation folders
            this.folders.items = this.folders.items.filter((folder) => {
                return this.Auth.user.isAdmin() || !folder.isOrganisationFolder();
            });

            this.folder = this.folders.items.find(folder => folder.id == this.currentDashboard.inFolder);
        }
    
        this.loading = false;
        this.dashboard = {
            name: 'Copy of ' + this.currentDashboard.name,
            description: this.currentDashboard.description
        };
    }

    copy() {
        this.validateFormFields();

        let params = {
            userId: this.Auth.user.username,
            dashboardId: this.currentDashboard.id,
            newName: this.dashboard.name,
            newDescription: this.dashboard.description,
            folderId: this.folder ? this.folder.id : null
        };

        if(this.form.$invalid) return;
        
        this.loading = true;
        
        this.DashboardCollection.copy(params).then((dashboard) => {
            this.CardCacheHelperService.resetMetricUsageCache(this.currentDashboard.metricIds());
            // Mark form as valid if name is unique
            this.form.name.$invalid = false;
            this.$uibModalInstance.dismiss();
            this.toaster.success('Dashboard cloned');
            this.$state.go('dashboard', {dashboardId: dashboard.id});
        }).catch(error => {
            // Name already exist, so user needs to change it
            // We display error under input field same style as normal validation
            this.form.name.$invalid = true;
            this.form.name.$error.unique = error.message || 'Something went wrong. Please try again.';
        }).finally(() => {
            this.loading = false;
        });
    }

    /**
     * Function that will trigger validation on all supplied fields for a form
     */
    validateFormFields() {
        ['name', 'description'].forEach((formControl) => {
            // Skip valid fields
            if (this.form[formControl].$dirty && this.form[formControl].$valid) return;

            // Mark all fields as dirty because that will trigger validation
            this.form[formControl].$dirty = true;
            this.form[formControl].$pristine = false;
        });

        this.submitted = true;
    }
}

class CopyDashboardController {
    constructor($uibModal, Auth, DashboardFolderService) {
        this.Auth = Auth;
        this.$uibModal = $uibModal;
        this.dashboardFolderService = DashboardFolderService;
    }

    openModal() {
        this.$uibModal.open({
            controller: CopyDashboardModalController,
            templateUrl: 'content/dashboard/copy.html',
            resolve: {
                folders: this.dashboardFolderService.load()
            },
            bindToController: true,
            controllerAs: 'cdm',
            size: 'md'
        });
    }
}

truedashApp.directive('tuCopyDashboard', () => {
    return {
        controller: CopyDashboardController,
        controllerAs: 'cd',
        restrict: 'A',
        scope: true
    };
});
