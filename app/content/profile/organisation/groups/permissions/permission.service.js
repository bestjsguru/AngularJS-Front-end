'use strict';

class PermissionService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    getAll() {
        return this.DataProvider.get('permission/list', {}, false).then(permissions => {
            permissions = permissions.map(permission => {
                permission.active = _.isBoolean(permission.active) ? permission.active : true;
                
                return permission;
            }).filter(permission => permission.active);
            
            permissions.sort((a, b) => a.title.localeCompare(b.title));
            
            return permissions;
        });
    }
    
    getForGroup(group) {
        return this.DataProvider.get('permission/getForGroup/' + group.id, {}, false);
    }
    
    saveForGroup(group, permissions) {
        let ids = permissions.filter(item => item.selected).map(item => item.id);
        
        return this.DataProvider.post('permission/saveForGroup/' + group.id, ids);
    }
}

truedashApp.service('PermissionService', PermissionService);
