class ShareDashboardModal {
    constructor($uibModalInstance, DashboardCollection) {
        this.$uibModalInstance = $uibModalInstance;
        this.dashboard = DashboardCollection.getActiveDashboard();
        this.init();
    }

    init() {
        this.selected = {
            email: null,
            message: null
        };
    }

    submit() {
        this.$uibModalInstance.close(this.selected);
    }
}

export const ShareDashboardModalOptions = {
    controller: ShareDashboardModal,
    templateUrl: 'content/dashboard/shareDashboardModal/shareDashboardModal.html',
    bindToController: true,
    controllerAs: 'sdm',
    size: 'md'
};
