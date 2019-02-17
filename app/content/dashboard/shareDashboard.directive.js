class SharePersonalDashboardModal {

    /**
     * @param {DashboardCollection} DashboardCollection
     */
    constructor(users, selectedUsers, $q, DashboardCollection, DashboardReportService, toaster, $uibModalInstance) {
        this.$q = $q;
        this.users = users;
        this.DashboardCollection = DashboardCollection;
        this.DashboardReportService = DashboardReportService;
        this.selectedUsers = selectedUsers;
        this.toaster = toaster;
        this.modalInstance = $uibModalInstance;
        this.init();
    }

    init() {
        this.usersPromise = this.$q.when(this.users);
        this.dashboard = this.DashboardCollection.getActiveDashboard();
        this.dashboard.isOwner();
    }

    getUserToShare() {
        return this.users.filter(user => user.getActive() && !user.getShared());
    }

    getUsersToUnshare() {
        return this.users.filter(user => !user.getActive() && user.getShared());
    }


    shareDashboard() {
        const requests = [];
        const usersToShare = this.getUserToShare();
        const usersToUnshare = this.getUsersToUnshare();

        if (usersToShare.length)
            requests.push(this.dashboard.users.share(usersToShare.map(user => user.email)));
        if (usersToUnshare.length)
            requests.push(this.dashboard.users.unshare(usersToUnshare.map(user => user.email)));

        if (!requests.length) {
            this.modalInstance.close();
            return;
        }

        this.$q.all(requests).then(() => {
            this.toaster.success('Your dashboard has been successfully shared.');
            this.modalInstance.close();
        }).catch((error) => {
            this.toaster.error(error);
        });
    }

    openShareDashboardDialog() {
        this.DashboardReportService.openShareDashboardDialog();
    }
}



class ShareDashboardController {

    /**
     * @param {OrganisationService} OrganisationService
     * @param {DashboardCollection} DashboardCollection
     * @param {Auth} Auth
     */
    constructor($q, $uibModal, OrganisationService, DashboardCollection, Auth, toaster) {
        this.DashboardCollection = DashboardCollection;
        this.toaster = toaster;
        this.$q = $q;
        this.OrganisationService = OrganisationService;
        this.Auth = Auth;
        this.$uibModal = $uibModal;
    }

    openShareModal() {
        if (!this.DashboardCollection.getActiveDashboard().isOwner()) {
            this.toaster.warning('You cannot share this dashboard because you do not own it.');
            return;
        }
        this.users = undefined;
        let selectedUsers = [];
        
        let promises = [this.OrganisationService.loadUsers(true), this.DashboardCollection.getActiveDashboard().users.load()];
        
        this.$q.all(promises).then(([organisationUsers, dashboardUsers]) => {
            this.users = organisationUsers.filter(user => user.email !== this.Auth.user.username);

            this.users.forEach(this.userDecorator);

            this.markSelectedUsers(this.users, dashboardUsers);
            selectedUsers = dashboardUsers.map(user => {
                this.userDecorator(user);
                return user;
            });
            
            return this.users;

        }).then(() => {
            this.openModal(this.users, selectedUsers);
        });
    }

    markSelectedUsers(users, sharedUsers) {
        users.forEach(user => {
            var sharedUser = sharedUsers.filter(sharedUser => sharedUser.email === user.email);

            if (sharedUser.length) {
                user.setShared(true);
            }
        });
    }

    openModal(users, selectedUsers) {
        this.modalInstance && this.modalInstance.dismiss();
        const modalOptions = {
            templateUrl: 'content/dashboard/shareDashboard.html',
            controller: SharePersonalDashboardModal,
            bindToController: true,
            controllerAs: 'sdc',
            resolve: {
                users: () => users,
                selectedUsers: () => selectedUsers
            },
            size: 'md'
        };
        this.modalInstance = this.$uibModal.open(modalOptions);
    }

    userDecorator(user) {
        let shared = false;

        user.getShared = function () {
            return shared;
        };

        user.setShared = function (bool) {
            shared = bool;
        };
    }
}

truedashApp.directive('tuShareDashboard', () => {
    return {
        require: {},
        controller: ShareDashboardController,
        bindToController: true,
        controllerAs: 'sdc',
        restrict: 'AE',
        scope: true
    };
});
