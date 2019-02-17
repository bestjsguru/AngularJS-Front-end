'use strict';

class SocialService {
    constructor(DataProvider, Auth, $q) {
        this.$q = $q;
        this.Auth = Auth;
        this.DataProvider = DataProvider;
    }
    
    getConnections() {
        return this.DataProvider.get('user/auth0UserDetails', {}, false).then(details => {
            return details.identities.filter(identity => identity.isSocial);
        });
    }
    
    deleteConnection(provider, userId) {
        return this.DataProvider.get('user/unlinkProvider', {provider, userId}, false);
    }
}

truedashApp.service('SocialService', SocialService);
