'use strict';

import {Config} from '../../../config';
import {ROLES} from './../../../common/data/RolesHelper';

class UserPermissionsCtrl {
    constructor(FolderSettingsService, $scope, toaster, DashboardFolderService) {
        /** @type {FolderSettingsService} **/
        this.FolderSettingsService = FolderSettingsService;
        this.$scope = $scope;
        this.toaster = toaster;
        /** @type {DashboardFolderService} **/
        this.DashboardFolderService = DashboardFolderService;

        this.roles = Config.user.roles;
    }

    changeRole(role){
        this.FolderSettingsService
            .applyByRole(role, this.user)
            .then(({role, list, groups, access}) => {
                this.saveChanges(role, list, groups, access);
            });
    }

    isActive(role){
        return this.user.role === role.id;
    }

    isShown(role) {
        return role.id !== ROLES.ROLE_EXTERNAL_USER;
    }

    saveChanges(role, list = [], groups = [], access){
        return this.DashboardFolderService
            .limitFoldersPerUser(this.user, role, list, groups, access)
            .then((user) => {
                this.user.setRole(role);
                this.user.accountExpired = user.accountExpired;
                this.user.expirationDate = user.expirationDate;

                this.toaster.success('User permissions have been changed');
            });
    }

}

truedashApp.component('tuUserPermissions',  {
    templateUrl: 'content/profile/organisation/userPermissions/userPermissions.html',
    controller: UserPermissionsCtrl,
    bindToController: true,
    controllerAs: '$ctrl',
    bindings: {
        user: '='
    }
});
