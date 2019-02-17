'use strict';

import './permission.service';

class GroupPermissionsModalController {
    constructor(OrganisationGroupsService, PermissionService) {
        this.PermissionService = PermissionService;
        this.OrganisationGroupsService = OrganisationGroupsService;
    }
    
    $onInit() {
        this.loading = true;
        this.group = _.cloneDeep(this.resolve.group);
    
        this.PermissionService.getAll().then(permissions => {
            return this.PermissionService.getForGroup(this.group).then(groupPermissions => {
        
                this.permissions = permissions.map(item => {
                    item.selected = groupPermissions.includes(item.id);
            
                    return item;
                });
            })
        }).finally(() => {
            this.loading = false;
        });
    }
    
    apply() {
        this.modalInstance.close({
            permissions: this.permissions
        });
    }
}

truedashApp.component('appGroupPermissionsModal', {
    controller: GroupPermissionsModalController,
    templateUrl: 'content/profile/organisation/groups/permissions/groupPermissionsModal.html',
    bindings: {
        modalInstance: "<",
        resolve: '<',
    }
});
