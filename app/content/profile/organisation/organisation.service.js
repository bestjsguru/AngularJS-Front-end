'use strict';

import {EventEmitter} from '../../system/events.js';
import {ROLES, RoleService} from '../../common/data/RolesHelper';
import Organisation from './organisation.model';

class OrganisationService extends EventEmitter {
    
    constructor(DataProvider, UserService, $q, Auth, $rootScope, OrganisationCacheHelperService, UserCacheHelperService, AppEventsService) {
        super();
        
        this.$q = $q;
        this.Auth = Auth;
        this.$rootScope = $rootScope;
        this.UserService = UserService;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.UserCacheHelperService = UserCacheHelperService;
        this.OrganisationCacheHelperService = OrganisationCacheHelperService;

        this.loadPromise = null;

        // Clear everything on logout
        this.Auth.on('logout', () => this.reset());
    }
    
    create(data) {
        return new Organisation(data);
    }
    
    load(useCache = true) {
        if (this.loadPromise) return this.loadPromise();
        
        this.loadPromise = () => {
            return this.DataProvider.get('organisation/info', {}, useCache).then((organisation) => {
                if (parseInt(this.Auth.user.organisation.id) !== parseInt(organisation.id)) {
                    console.error(`User organisation id = ${this.Auth.user.organisation.id} is not equal organisation info id = ${organisation.id}`);
                }
                this.UserCacheHelperService.setOrganisationDetails(organisation);
                
                return this.create(organisation);
            }).finally(() => {
                this.loadPromise = null;
            });
        };
        
        return this.loadPromise();
    }

    loadUsers(useCache = false) {
        return this.DataProvider.get('user/organisationUsers', {}, useCache).then(users => {
            return users.map(user => this.UserService.create(user));
        });
    }

    reset() {
        this.loadPromise = null;
    }

    update(organisation) {
        return this.DataProvider.post('organisation/update', organisation.getData()).then((response) => {
            this.UserCacheHelperService.setOrganisationDetails(response);
            this.OrganisationCacheHelperService.setOrganisationInfo(response);
            
            this.trigger('updated', organisation);
        }).catch((error) => {
            this.OrganisationCacheHelperService.clear();
            console.error('Cannot update organisation data');
            return this.$q.reject(error);
        });
    }

    updatePicture(organisation) {
        return this.DataProvider.postWithUpload('organisation/addLogo', {orgId: organisation.id}, organisation.logoFile).then((response) => {
            this.UserCacheHelperService.setOrganisationLogo(response.filePath);
            this.OrganisationCacheHelperService.setOrganisationLogo(response.filePath);
            organisation.setLogo(response.filePath || '');
    
            this.trigger('updated.logo', organisation);
        }).catch((error) => {
            this.OrganisationCacheHelperService.clear();
            console.error('Cannot update organisation logo');
            return this.$q.reject(error);
        });
    }
    
    removePicture(organisation) {
        return this.DataProvider.get('organisation/removeLogo', null, false).then(() => {
            this.UserCacheHelperService.setOrganisationLogo('');
            this.OrganisationCacheHelperService.setOrganisationLogo('');
            organisation.setLogo('');
    
            this.trigger('updated.logo', organisation);
        }).catch((error) => {
            this.OrganisationCacheHelperService.clear();
            console.error('Cannot remove organisation logo');
            return this.$q.reject(error);
        });
    }

    inviteUser(email, message, folders = [], groups = [], authority = ROLES.ROLE_USER, access) {

        let params = {
            email: email,
            message: message,
            authority: RoleService.getNameById(authority),
            folderIds: folders.items.filter(folder => folder.selected).map(folder => folder.id),
            dashboardIds: folders.items.reduce((ids, folder) => {
                folder.dashboards.forEach(dashboard => {
                    dashboard.selected && ids.push(dashboard.id);
                });
        
                return ids;
            }, []),
            groups: groups,
        };
    
        if(access.forever) params.forever = access.forever;
        if(!access.forever && access.limit) params.limit = access.limit;
    
        return this.DataProvider.post('user/inviteUser', params).then(response => {
            this.AppEventsService.track('invited-user', {
                email: params.email,
                limit: params.limit,
                forever: params.forever,
                message: params.message,
                authority: params.authority,
                folder_ids: params.folderIds.join(', '),
                dashboard_ids: params.dashboardIds.join(', '),
                groups: params.groups.join(', '),
            });

            return response;
        });
    }

    deleteMember(organisation, member, owner) {
        let params = {email: member.email};
        if(owner) params.owner = owner.email;

        return this.DataProvider.post('user/delete', params).then(() => {
            this.$rootScope.$emit('dashboard.invalidate');
            organisation.users = organisation.users.filter(user => user.email !== member.email);
        });
    }

    cancelInvite(member) {
        return this.DataProvider.post('user/cancelInvitationByExistingUser', {email: member.email});
    }

    resendInvite(member) {
        return this.DataProvider.post('user/resendInvite', {email: member.email});
    }
}

truedashApp.service('OrganisationService', OrganisationService);
