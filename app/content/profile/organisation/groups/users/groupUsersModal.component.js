import {ROLES} from '../../../../common/data/RolesHelper';
'use strict';

class GroupUsersModalController {
    constructor(OrganisationService, DeregisterService, $scope) {
        this.OrganisationService = OrganisationService;
        this.query = '';
        
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.select = {
            admin: {
                selected: false,
                id: ROLES.ROLE_ADMIN,
            },
            basic: {
                selected: false,
                id: ROLES.ROLE_USER,
            },
            readOnly: {
                selected: false,
                id: ROLES.ROLE_VIEW,
            },
        };
        
        this.loading = true;
        this.group = _.cloneDeep(this.resolve.group);
        
        this.OrganisationService.loadUsers().then(users => {
            // Remove external users from the list
            users = users.filter(user => !user.isExternal());
            
            //put group users first then sort by name
            users.sort((a, b) => {
                if (this.group.hasUser(a) && this.group.hasUser(b) || !this.group.hasUser(a) && !this.group.hasUser(b)) return a.fullName.localeCompare(b.fullName);
                if (this.group.hasUser(a) && !this.group.hasUser(b)) return -1;
                return 1;
            });
            
            this.allUsers = users;
            this.users = this.allUsers.filter(item => item);
            
            this.removeInvalidUsersFromGroup();
            this.refreshSelectedStatus();
        }).finally(() => {
            this.loading = false;
        });
    }
    
    apply() {
        this.modalInstance.close({
            users: this.group.users
        });
    }
    
    filter() {
        this.users = this.allUsers.filter((item) => {
            let searchName = item.fullName.toLowerCase().includes(this.query.toLowerCase());
            let searchEmail = item.email.toLowerCase().includes(this.query.toLowerCase());
            
            return searchName || searchEmail;
        });
    
        this.refreshSelectedStatus();
    }
    
    refreshSelectedStatus() {
        this.select.admin.selected = this.selectedByRole('admin');
        this.select.basic.selected = this.selectedByRole('basic');
        this.select.readOnly.selected = this.selectedByRole('readOnly');
    }
    
    toggleUser(user) {
        this.group.toggleUser(user);
    
        this.refreshSelectedStatus();
    }
    
    removeInvalidUsersFromGroup() {
        this.group.users = this.group.users.reduce((users, userId) => {
            if(this.users.find(user => user.id === userId)) users.push(userId);
            
            return users;
        }, []);
    }
    
    hasAtLeastOneUserInRole(role) {
        // We need to check if there is at least one user in this role
        return this.allUsers.find(user => user.role === this.select[role].id);
    }
    
    atLeastOneSelectedByRole(role) {
        // We need to check if there is at least one user selected from this role
        return this.allUsers.find(user => user.role === this.select[role].id && this.group.hasUser(user));
    }
    
    selectedByRole(role) {
        // We need to check if there is at least one user that's not in the group
        return this.hasAtLeastOneUserInRole(role) && !this.allUsers.find(user => user.role === this.select[role].id && !this.group.hasUser(user));
    }
    
    toggleByRole(role) {
        this.select[role].selected = !this.select[role].selected;
        
        this.users.forEach(user => {
            if(user.role === this.select[role].id) {
                this.select[role].selected ? this.group.addUser(user) : this.group.removeUser(user);
            }
        });
    
        this.refreshSelectedStatus();
    }
}

truedashApp.component('appGroupUsersModal', {
    controller: GroupUsersModalController,
    templateUrl: 'content/profile/organisation/groups/users/groupUsersModal.html',
    bindings: {
        modalInstance: "<",
        resolve: '<',
    }
});
