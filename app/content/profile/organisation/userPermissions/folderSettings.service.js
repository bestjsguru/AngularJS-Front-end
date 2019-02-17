"use strict";

import {FolderVisibilityController} from './folderVisibility.controller.js';
import {Authorize} from '../../../common/authorize';


class FolderSettingsService {
    constructor($uibModal, $q, Auth) {
        this.$uibModal = $uibModal;
        this.$q = $q;
        this.Auth = Auth;
    }

    showModal(user, role){
        // If there is already modal active we need to close it before opening new one
        this.modalInstance && this.modalInstance.dismiss();

        this.modalInstance = this.$uibModal.open({
            controller: FolderVisibilityController,
            templateUrl: 'content/profile/organisation/userPermissions/userPermissions.modal.html',
            bindToController: true,
            controllerAs: '$ctrl',
            size: 'md',
            resolve: {
                user: () => { return user },
                role: () => { return role }
            }
        });

        return this.modalInstance;
    }

    applyByRole(role, user = this.Auth.user){
        let def = this.$q.defer();

        // const isNotCurrentRole = user === this.Auth.user || user.role !== role.id;
        // const isAdminSelected = Authorize.isAdmin(role.id);
        //
        // let userObject = isAdminSelected && isNotCurrentRole ? null : user;
        
        this.showModal(user, role).result.then((response) => {
            def.resolve({
                role: role,
                list: response.list,
                groups: response.groups,
                access: response.access
            });
        });

        return def.promise;
    }
}

truedashApp.service('FolderSettingsService', FolderSettingsService);
