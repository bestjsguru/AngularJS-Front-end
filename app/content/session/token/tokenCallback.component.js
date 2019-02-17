'use strict';

class TokenCallbackCtrl {
    constructor(Auth, $state, Token, RedirectService) {
        this.Auth = Auth;
        this.Token = Token;
        this.$state = $state;
        this.RedirectService = RedirectService;
    
        // Check if user is already logged in and redirect to desired page
        !Auth.isLoggedIn() && this.redirectToLoginPage();
    }
    
    $onInit() {
        if(!window.Location.code) return this.redirectToNextPage();
        
        this.Token.createRefreshToken(window.Location.code).then(() => {
            this.Auth.user.hasRefreshToken = true;
            this.Auth.trigger('updated');
        }).finally(() => {
            this.redirectToNextPage();
        });
    }

    redirectToLoginPage() {
        this.Auth.clearSession();
        this.Auth.redirectToLogin();
    }
    
    redirectToNextPage() {
        // Check to see if there are routes that we need to redirect user to after logging in
        if(!this.RedirectService.restoreRememberedState()){
            this.$state.go('home', null, {location: 'replace'});
        }
    }
}

truedashApp.component('appTokenCallback', {
    controller: TokenCallbackCtrl,
    templateUrl: 'content/session/token/tokenCallback.html',
});
