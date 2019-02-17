'use strict';

import './apiToken.service';

class ApiTokenCtrl {
    constructor(Auth, ApiTokenService) {
        this.Auth = Auth;
        this.ApiTokenService = ApiTokenService;
    
        this.apiToken = null;
    }
    
    $onInit() {
        this.loading = true;
    
        this.ApiTokenService.getToken().then(token => {
            this.apiToken = token;
        }).finally(() => {
            this.loading = false;
        });
    }
    
    generate() {
        this.generating = true;
        
        this.ApiTokenService.generateToken().then(token => {
            this.apiToken = token;
        }).finally(() => {
            this.generating = false;
        });
    }
}

truedashApp.component('appApiToken', {
    controller: ApiTokenCtrl,
    templateUrl: 'content/profile/details/apiToken/apiToken.html',
});





