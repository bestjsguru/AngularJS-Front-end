'use strict';

import './organisationGroups.service';
import './users/groupUsersModal.component';
import './permissions/groupPermissionsModal.component';
import '../filters/group/groupFilterButton.component';

class OrganisationGroupsCtrl {
    
    constructor($q, toaster, Auth, $uibModal, OrganisationService, OrganisationGroupsService, DeregisterService, $scope,
                PermissionService, UserService, $confirm) {
        this.$q = $q;
        this.Auth = Auth;
        this.toaster = toaster;
        this.$confirm = $confirm;
        this.$uibModal = $uibModal;
        this.UserService = UserService;
        this.PermissionService = PermissionService;
        this.OrganisationService = OrganisationService;
        this.OrganisationGroupsService = OrganisationGroupsService;
        
        this.loading = false;
        this.user = this.Auth.user;
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.loading = true;
        this.OrganisationGroupsService.getAll().then(groups => {
            this.groups = groups;
        }).finally(() => {
            this.loading = false;
        });
        
        this.loadOrganisation();
    }
    
    users(group) {
        this.$uibModal.open({
            size: 'md',
            component: 'appGroupUsersModal',
            bindToController: true,
            resolve: {
                group: () => group,
            }
        }).result.then((response) => {
            let currentUserAffected = ([group.users, response.users].filter(users => users.includes(this.user.id)).length === 1);
    
            group.users = response.users;
            this.save(group).then(() => {
                currentUserAffected && this.refreshCurrentUserPermissions();
            });
        });
    }
    
    permissions(group) {
        this.$uibModal.open({
            size: 'md',
            component: 'appGroupPermissionsModal',
            bindToController: true,
            resolve: {
                group: () => group,
            }
        }).result.then((response) => {
            let currentUserAffected = group.users.includes(this.user.id);
            
            this.PermissionService.saveForGroup(group, response.permissions).then(() => {
                currentUserAffected && this.refreshCurrentUserPermissions();
            });
        });
    }
    
    add() {
        let group = this.OrganisationGroupsService.create();
        group.inEditMode = true;
        
        this.groups.push(group);
    }
    
    edit(group) {
        group.inEditMode = true;
    }
    
    cancel(group) {
        group.inEditMode = false;
        
        if(!group.id) {
            this.groups = this.groups.filter(item => item !== group);
        }
    }
    
    remove(group) {
        return this.$confirm({
            title: 'Remove user group',
            text: `Are you sure you want to remove <strong>${group.name}</strong> group? This action can not be undone.`,
            ok: 'Remove',
            cancel: 'Cancel'
        }).then(() => {
            let currentUserAffected = group.users.includes(this.user.id);
            
            this.OrganisationGroupsService.remove(group).then(() => {
                this.groups = this.groups.filter(item => item !== group);
    
                currentUserAffected && this.refreshCurrentUserPermissions();
            });
        });
    }
    
    save(group) {
        let promise = this.OrganisationGroupsService.update(group);
        
        if(!group.id) {
            promise = this.OrganisationGroupsService.save(group);
        }
    
        return promise.then((response) => {
            group.id = response.id;
            group.inEditMode = false;
        }).catch(error => {
            this.toaster.error(error.message);
        });
    }
    
    loadOrganisation() {
        this.OrganisationService.load().then((organisation) => {
            this.organisation = organisation;
        });
    }
    
    refreshCurrentUserPermissions() {
        return this.UserService.info().then((details) => {
            this.Auth.updateUser({
                permissions: details.permissions,
            });
    
            this.Auth.trigger('permission-updated');
        });
    }
}

truedashApp.component('appOrganisationGroups', {
    controller: OrganisationGroupsCtrl,
    templateUrl: 'content/profile/organisation/groups/organisationGroups.html',
});
