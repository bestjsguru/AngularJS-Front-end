'use strict';

import {Config} from '../../config';
import {EventEmitter} from '../../system/events';

class Token extends EventEmitter {
    
    constructor(DataProvider, DeregisterService, $q, Auth) {
        super();
        this.$q = $q;
        this.Auth = Auth;
        this.DataProvider = DataProvider;
        
        this.watchers = DeregisterService.create();
        
        this.auth0Config = Config.auth0[Config.currentServer];
        
        this.auth0Api = window.axios.create({baseURL: `https://${this.auth0Config.domain}/`});
    }
    
    redirectToAuthorize() {
        let params = {
            audience: `audience=https://${Config.currentServer}.avora.io`,
            scope: 'scope=openid email profile offline_access',
            responseType: 'response_type=code',
            clientId: 'client_id=' + this.auth0Config.clientId,
            redirect: `redirect_uri=${this.auth0Config.profileRedirectUrl}`,
        };
    
        window.location = `https://${this.auth0Config.domain}/authorize?${params.audience}&${params.scope}&${params.responseType}&${params.clientId}&${params.redirect}&prompt=none`;
    }
    
    createRefreshToken(code) {
        return this.DataProvider.post('user/createRefreshToken', {
            redirectUri: this.auth0Config.profileRedirectUrl,
            code: code,
        });
    }
    
    removeRefreshToken() {
        return this.DataProvider.post('user/removeRefreshToken');
    }
}

truedashApp.service('Token', Token);
