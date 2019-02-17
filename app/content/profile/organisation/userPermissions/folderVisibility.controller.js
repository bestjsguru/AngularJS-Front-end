'use strict';

import {Authorize} from '../../../common/authorize';
import {ROLES} from '../../../common/data/RolesHelper';

export class FolderVisibilityController {
    
    constructor(DashboardFolderService, $q, Auth, OrganisationGroupsService, user, role) {
        /** @type {DashboardFolderCollection} **/
        this.folders = {
            items: [],
        };
        this.groups = [];
        this.loading = true;
        this.error = false;
        this.user = user;
        this.role = role;
        this.query = '';
    
        this.isCurrentUser = this.user.id === Auth.user.id;
        this.isAdminSelected = Authorize.isAdmin(role.id);
    
        this.selectedTab = 'permissions';
        this.ranges = [
            {label: 'Hours', value: 'hours'},
            {label: 'Days', value: 'days'},
            {label: 'Weeks', value: 'weeks'},
            {label: 'Months', value: 'months'}
        ];
        this.limit = {
            period: false,
            forever: this.isCurrentUser,
            number: 1,
            range: this.ranges[2]
        };

        let promises = $q.all({
            groups: OrganisationGroupsService.getAll(),
            folders: this.isAdminSelected ? false : DashboardFolderService.load(false),
            statuses: this.isAdminSelected ? false : DashboardFolderService.getFolderStatusPerUser(this.user)
        });

        promises.then(({groups, folders, statuses}) => {
            this.groups = groups;
            this.preselectGroups();
            
            if(folders) {
                this.folders = folders;
                this.folders.items = this.folders.items.filter(folder => folder.isOrganisationFolder());
    
                this.folders.forEach(folder => folder.collapsed = true);
    
                this.folders.forEach(folder => {
                    folder.dashboards.forEach(dashboard => {
                        dashboard.folderName = folder.title;
                    });
                });
    
                statuses && this.initStatuses(statuses);
    
                this.error = this.folders.filter(folder => folder.selected || folder.partiallySelected).length === 0;
            }
        }).finally(() => {
            this.loading = false;
        });
    }
    
    clear() {
        this.query = '';
        this.filter();
    }
    
    initStatuses(statuses) {
        return this.folders.forEach(folder => {
            let folderSelected = statuses.folders.includes(folder.id);
            this.setFolderStatus(folder, folderSelected);
            
            if(!folderSelected) {
                folder.dashboards.forEach(dashboard => {
                    let dashboardSelected = statuses.dashboards.includes(dashboard.id);
                    this.setDashboardStatus(folder, dashboard, dashboardSelected);
                });
            }
        });
    }
    
    filter() {
        this.folders.forEach(folder => {
            folder.hidden = true;
            folder.collapsed = true;
            folder.dashboards.forEach(dashboard => dashboard.hidden = true);
            
            if(folder.title.toLowerCase().includes(this.query.toLowerCase())) {
                folder.hidden = false;
                folder.collapsed = !this.query.length;
                folder.dashboards.forEach(dashboard => dashboard.hidden = false);
            } else {
                let dashboards = folder.dashboards.filter(dashboard => {
                    return dashboard.name.toLowerCase().includes(this.query.toLowerCase());
                });
                
                if(dashboards.length) {
                    folder.hidden = false;
                    folder.collapsed = !this.query.length;
                    dashboards.forEach(dashboard => dashboard.hidden = false);
                }
            }
        });
    }
    
    dashboardCount(folder) {
        if(folder.selected) return 'All';
        
        let selectedCount = folder.dashboards.filter(dashboard => dashboard.selected).length;
        
        return `${selectedCount}/${folder.dashboards.length}`;
    }
    
    allHidden() {
        return this.folders.items.every(folder => folder.hidden);
    }
    
    toggleSelection() {
        let newStatus = true;
        
        if(this.allSelected()) newStatus = false;
    
        this.folders.forEach(folder => this.setFolderStatus(folder, newStatus));
    }
    
    allSelected() {
        return this.folders.items.every(folder => folder.selected);
    }
    
    toggleCollapse() {
        let newStatus = true;
        
        if(this.allCollapsed()) newStatus = false;
        
        this.folders.forEach(folder => folder.collapsed = newStatus);
    }
    
    allCollapsed() {
        return this.folders.items.every(folder => folder.collapsed);
    }
    
    toggleDashboard(folder, dashboard) {
        if(folder.selected) return;
        
        this.setDashboardStatus(folder, dashboard, !dashboard.selected);
    }
    
    setDashboardStatus(folder, dashboard, status) {
        dashboard.selected = status;
        
        folder.partiallySelected = folder.dashboards.some(dashboard => dashboard.selected);
    
        this.error = this.folders.filter(folder => folder.selected || folder.partiallySelected).length === 0;
    }
    
    toggleFolder(folder) {
        this.setFolderStatus(folder, !folder.selected);
    }
    
    toggleFolderCollapse($event, folder) {
        $event.stopPropagation();
        $event.preventDefault();
        
        folder.collapsed = !folder.collapsed;
    }
    
    setFolderStatus(folder, status) {
        folder.selected = status;
        folder.partiallySelected = false;
        
        // Deselect all folder dashboards
        folder.dashboards.forEach(dashboard => dashboard.selected = false);
        
        this.error = this.folders.filter(folder => folder.selected || folder.partiallySelected).length === 0;
    }

    save(){
        !this.error && this.$close({
            list: this.folders,
            groups: this.groups.filter(group => group.selected).map(group => group.id),
            access: this.getAccessObject()
        });
    }
    
    getAccessObject() {
        
        let access = {
            limit: 0,
            forever: true
        };
        
        if(!this.limit.forever) {
            access.forever = false;
        }
    
        if(this.limit.period) {
            switch(this.limit.range.value) {
                case 'hours':
                    access.limit = this.limit.number;
                    break;
                case 'days':
                    access.limit = 24 * this.limit.number;
                    break;
                case 'weeks':
                    access.limit = 24 * 7 * this.limit.number;
                    break;
                case 'months':
                    access.limit = 24 * 30 * this.limit.number;
                    break;
                default:
                    access.limit = 0;
                    break;
            }
        }
        
        return access;
    }
    
    
    toggleGroupsSelection() {
        let newStatus = true;
        
        if(this.allGroupsSelected()) newStatus = false;
        
        this.groups = this.groups.map(group => {
            group.selected = newStatus;
            
            return group;
        });
    }
    
    allGroupsSelected() {
        return this.groups.every(group => group.selected);
    }
    
    noGroupsSelected() {
        return this.groups.every(group => !group.selected);
    }
    
    toggleGroup(group) {
        group.selected = !group.selected;
    }
    
    preselectGroups() {
        this.groups = this.groups.map(group => {
            if(!this.isCurrentUser && group.hasUser(this.user)) group.selected = true;
            
            return group;
        });
        
        if(this.noGroupsSelected()) {
            this.groups = this.groups.map(group => {
                switch(this.role.id) {
                    case ROLES.ROLE_ADMIN:
                        if(group.name.toLowerCase().includes('admin')) group.selected = true;
                        break;
                    case ROLES.ROLE_USER:
                        if(group.name.toLowerCase().includes('basic')) group.selected = true;
                        break;
                    case ROLES.ROLE_VIEW:
                        if(group.name.toLowerCase().includes('read')) group.selected = true;
                        break;
                }
        
                return group;
            });
        }
    }
}
