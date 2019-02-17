'use strict';

class ApiTokenService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    generateToken() {
        return this.DataProvider.get('user/generateUserAPIKey', {}, false).then(response => {
            return response.tokenValue;
        });
    }
    
    getToken() {
        return this.DataProvider.get('user/getUserAPIKey', {}, false).then(response => {
            return response.tokenValue;
        }).catch(angular.noop);
    }
}

truedashApp.service('ApiTokenService', ApiTokenService);
