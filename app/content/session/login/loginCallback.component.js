'use strict';

import {Config} from '../../config';

class LoginCallbackCtrl {
    constructor(Auth, Token, $state, RedirectService, AppEventsService) {
        this.Auth = Auth;
        this.Token = Token;
        this.$state = $state;
        this.AppEventsService = AppEventsService;
        this.RedirectService = RedirectService;
    
        // Check if user is already logged in and redirect to desired page
        Auth.isLoggedIn() && this.redirectToNextPage();
    }
    
    $onInit() {
        // this.DashboardCollection.unload();
        
        this.Auth.on('login', () => {
            this.AppEventsService.track(Config.isMobile ? 'logged-in-via-mobile' : 'logged-in');
            this.redirectToNextPage();
        });
    }

    redirectToNextPage() {
        if(!this.Auth.user.hasRefreshToken) {
            this.Token.redirectToAuthorize();
        } else {
            // Check to see if there are routes that we need to redirect user to after logging in
            if(!this.RedirectService.restoreRememberedState()){
                this.$state.go('home', null, {location: 'replace'});
            }
        }
    }
}

truedashApp.component('appLoginCallback', {
    controller: LoginCallbackCtrl,
    templateUrl: 'content/session/login/loginCallback.html',
});
