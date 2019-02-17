'use strict';

import {EventEmitter} from '../system/events.js';
import {Config} from '../config';

class Auth extends EventEmitter {

    constructor($state, $rootScope, CacheService, DataProvider, UserService, $q, $http, angularAuth0, AnalyticsSegment,
                DelightedService, TrueTagService, BranchService, PusherService, DeregisterService,
                NewRelicService, DeskService, AppEventsService, FullstoryService, jwtHelper) {
        super();
        this.$q = $q;
        this.$http = $http;
        this.$state = $state;
        this.jwtHelper = jwtHelper;
        this.UserService = UserService;
        this.DataProvider = DataProvider;
        this.CacheService = CacheService;
        this.angularAuth0 = angularAuth0;
    
        this.AppEventsService = AppEventsService;
        this.AnalyticsSegment = AnalyticsSegment;
        this.FullstoryService = FullstoryService;
        this.DelightedService = DelightedService;
        this.TrueTagService = TrueTagService;
        this.DeskService = DeskService;
        this.NewRelicService = NewRelicService;
        this.BranchService = BranchService;
        this.PusherService = PusherService;

        /** @type {User} */
        this.user = this.UserService.create();
        
        this.watchers = DeregisterService.create();
        
        this.on('updated', () => {
            this.CacheService.putPermanent('user', this.user.getData());
        });
    }

    isLoggedIn() {
        let token = localStorage.getItem('token');
    
        return token && !this.jwtHelper.isTokenExpired(token);
    }
    
    handleLogin() {
        return this.$q((resolve, reject) => {
        
            if (window.Location.token) {
                // hack for sharing direct link to the dashboard
                return this.loginWithToken(window.Location.token).then(() => {
                    resolve();
                }).catch(() => {
                    reject();
                });
            } else if (window.Location.isEmbed) {
                // Proper SSO embedding using email, nonce and signature
                return this.embeddedLogin().then(() => {
                    resolve();
                }).catch(() => {
                    reject();
                });
            } else {
                this.handleAuthentication();
            
                resolve();
            }
        });
    }
    
    handleAuthentication() {
        return this.angularAuth0.parseHash((err, authResult) => {
            let hasTokenValues = authResult && authResult.accessToken && authResult.idToken;
    
            if(!hasTokenValues) {
                if(window.Location.isCallback) this.redirectToLogin();
                
                return;
            }
    
            let params = {token: authResult.accessToken, jwt: authResult.idToken};
    
            return this.DataProvider.post('user/login', params, {Authorization: undefined}).then(user => {
                console.log(JSON.stringify(user));
                
                this.setUserSession(user, authResult.accessToken, authResult.idToken, authResult.expiresIn);
                
                this.AppEventsService.track('login', {type: 'regular'});
            }).catch(error => {
                console.log(error);
                this.redirectToLogin();
            });
        });
    }
    
    loginWithToken(accessToken) {
        this.DataProvider.setAuthToken(accessToken);
        
        return this.DataProvider.post('user/getJwtToken').then(response => {
            let params = {token: accessToken, jwt: response.jwtToken};
    
            return this.DataProvider.post('user/login', params, {Authorization: undefined}).then(user => {
                this.user.reset();
                this.CacheService.removeAll(true);
                this.resetServices();
    
                this.setUserSession(user, accessToken, response.jwtToken);
    
                this.AppEventsService.track('login', {type: 'token'});
            });
        }).catch(error => {
            console.log(error);
        });
    }
    
    embeddedLogin() {
        // Embedded login can only be accessed from within Iframe so we redirect to login in other cases
        if(!window.Location.inIframe) return this.login();
        
        this.CacheService.putPermanent('embeddedLogin', window.Location.embedParams);
    
        return this.DataProvider.post('user/getEmbedToken', window.Location.embedParams,  {Authorization: undefined}).then(user => {
            this.user.reset();
            this.CacheService.removeAll(true);
            this.resetServices();
    
            this.setUserSession(user, user.tokenValue, user.jwtToken);
    
            this.AppEventsService.track('login', {type: 'embedded'});
        }).catch(error => {
            this.clearHttpRequests();
            this.clearSession();
            
            this.$state.go('login');
        });
    }
    
    setUserSession(user, accessToken, idToken, expiresIn = 36000) {
        user.accessToken = accessToken;
        user.idToken = idToken;
        user.expiresAt = JSON.stringify((expiresIn * 1000) + new Date().getTime());
        
        localStorage.setItem('access_token', user.accessToken);
        localStorage.setItem('token', user.idToken);
        localStorage.setItem('expires_at', user.expiresAt);
        
        this.setUser(user);
    }
    
    login() {
        this.clearSession();
        this.CacheService.removePermanent('embeddedLogin');
        this.angularAuth0.authorize();
    }

    /**
     * Initiate user saved in local storage
     */
    initUser() {
        this.user = this.UserService.create(this.CacheService.getPermanent('user'));
        this.DataProvider.setAuthToken(this.user.token.value);
        this.initServices();
    }

    setUser(data) {
        this.user.init(data);
        this.CacheService.putPermanent('user', this.user.getData());
        this.DataProvider.setAuthToken(this.user.token.value);
        this.initServices();
        this.trigger('login');
    }
    
    updateUser(data) {
        let user = this.user.getData();
        
        _.assign(user, data);
        
        this.user.init(user);
        this.CacheService.putPermanent('user', this.user.getData());
    }

    clearSession() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('expires_at');
        
        this.user.reset();
        this.CacheService.removeAll();
        this.resetServices();
        this.DataProvider.setAuthToken();

        return this.trigger('logout');
    }
    
    clearEmbeddedSession() {
        this.CacheService.removePermanent('user');
        this.CacheService.removePermanent('embeddedLogin');
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        localStorage.removeItem('expires_at');
    }

    clearHttpRequests() {
        let result = this.$q.defer();

        this.DataProvider.queue = [];
        this.DataProvider.activeRequests = 0;

        let numberOfPendingRequests = this.$http.pendingRequests.lenght;

        if(!numberOfPendingRequests) result.resolve();

        this.$http.pendingRequests.forEach((request, index) => {
            this.$http.abort(request);
            if(numberOfPendingRequests === index+1) result.resolve();
        });

        return result.promise;
    }

    redirectToLogin() {
        this.angularAuth0.logout({
            returnTo: `${Config.appUrl}/login`,
            clientID: Config.auth0[Config.currentServer].clientId
        });
    }
    
    logout(redirectToLogin = true) {
        
        let promise = this.$q.when(true);
    
        if (this.isLoggedIn()) {
            promise = this.clearHttpRequests().then(() => {
                return this.DataProvider.get('user/logout', {}, false);
            });
        }
        
        promise.finally(() => {
            this.clearSession();
    
            redirectToLogin && this.redirectToLogin();
        });
    }
    
    initServices() {
        if(window.Location.isExport) return;
        
        this.AppEventsService.init(this.user);
        this.AnalyticsSegment.init(this.user);
        this.TrueTagService.init(this.user);
        this.DeskService.init();
        this.NewRelicService.init();
        this.BranchService.init();
        this.FullstoryService.init(this.user);
        this.DelightedService.init(this.user);
        this.PusherService.init(this.user);
    
        if(window.bugsnagClient) {
            window.bugsnagClient.user = {
                id: this.user.id,
                email: this.user.email,
                name: this.user.fullName,
            };

            window.bugsnagClient.metaData = {
                organisation: {
                    id: this.user.organisation.id,
                    name: this.user.organisation.name,
                }
            };
        }
        
        delete window.isDemo;
        if(this.user.isDemo()) window.isDemo = true;
    }
    
    resetServices() {
        if(window.Location.isExport) return;
        
        this.AnalyticsSegment.reset();
        this.PusherService.reset();
        this.AppEventsService.reset();
    
        if(window.bugsnagClient) {
            window.bugsnagClient.user = {};
            window.bugsnagClient.metaData = {};
        }
    }
}

truedashApp.service('Auth', Auth);
