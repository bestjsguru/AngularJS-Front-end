'use strict';

import {ServiceUser, ExternalUser, InvitedUser} from './user.model';
import {ROLES} from '../common/data/RolesHelper';

class UserService {
    constructor(DataProvider, User) {
        this.User = User;
        this.DataProvider = DataProvider;
    }

    create(data) {
        // '_export' emails are used for pdf and ppt exports
        if(data && (data.role === ROLES.ROLE_EXTERNAL_USER || (data.username && data.username.includes('_export')))){
            return new ExternalUser(data);
        }
    
        if(data && !data.acceptedInvite){
            return new InvitedUser(data);
        }
        
        if((data && data.userService) || (data && data.username && data.username.includes('@avora.com'))){
            return new ServiceUser(data);
        }

        return new this.User(data);
    }

    retreiveUserDetails(email, useCache = true) {
        return this.DataProvider.get('user/retrieve', {email: email}, useCache);
    }

    info() {
        return this.DataProvider.get('user/info', {}, false);
    }

    saveUserDetails(details) {
        return this.DataProvider.post('user/update', details, false);
    }

    setRestoreId(restoreId) {
        return this.DataProvider.post('user/setRestoreId', {restoreId}, false);
    }

    invalidateLoadUser(email) {
        return this.DataProvider.clearCache('user/retrieve', {email: email}, 'GET');
    }

    savePicture(file) {
        return this.DataProvider.postWithUpload('user/uploadPhoto', {username: window.Auth.user.username}, file).catch((error) => {
            console.error('Cannot update user picture');
            
            return error;
        }).finally(() => {
            this.invalidateLoadUser(window.Auth.user.username);
        });
    }
}

truedashApp.service('UserService', UserService);
