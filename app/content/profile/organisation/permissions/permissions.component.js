'use strict';

import {Config} from '../../../config';

class PermissionsController {
    constructor() {
    
    }

    $onInit() {
        this.member = this.resolve.member;
    }
    
    roleIs(role) {
        return this.roleName === role;
    }
    
    get roleName(){
        const role = Config.user.roles.find(role => this.member.role === role.id) || {};
        
        return role.name || '';
    }
}

truedashApp.component('appPermissions', {
    controller: PermissionsController,
    templateUrl: 'content/profile/organisation/permissions/permissions.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
