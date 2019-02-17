'use strict';

class LoginCtrl {
    constructor(Auth) {
        this.Auth = Auth;
    }
    
    $onInit() {
        !this.isEmbed && this.Auth.login();
    }
    
    get isEmbed() {
        return window.Location.isEmbed;
    }
}

truedashApp.component('appLogin', {
    controller: LoginCtrl,
    templateUrl: 'content/session/login/login.html',
});
