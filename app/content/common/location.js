'use strict';

class Location {
    constructor($location) {
        this.set($location);
        
        this.CacheService = window.$injector.get('CacheService');
    }

    set($location) {
        this.$location = $location;

        this.token = $location.search().token || false;
        this.code = $location.search().code || false;
        this.isLogin = $location.path().indexOf('login') >= 0;
        this.isLogout = $location.path().indexOf('logout') >= 0;
        this.isCallback = $location.path().indexOf('callback') >= 0;
        this.isPublish = $location.search().export === 'html';
        this.isExport = this.isPublish || this.token;
        this.isPrintable = ['true', '1'].includes($location.search().isPrintable) || false;
        this.isPPT = ['true', '1'].includes($location.search().isPPT) || false;
        this.withDashboardFilters = $location.search().withDashboardFilters === 'true';
    }
    
    get embedParams() {
        let cachedParams = this.CacheService.getPermanent('embeddedLogin', {});
        
        return {
            email: this.$location.search().email || cachedParams.email,
            nonce: this.$location.search().nonce || cachedParams.nonce,
            timestamp: this.$location.search().timestamp || cachedParams.timestamp,
            signature: this.$location.search().signature || cachedParams.signature,
        }
    }
    
    get isEmbed() {
        if(this.CacheService.getPermanent('embeddedLogin', false)) return true;
        
        return this.$location.search().email && this.$location.search().timestamp && this.$location.search().nonce && this.$location.search().signature;
    }

    get isPhantom() {
        return this.token;
    }
    
    get inIframe() {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }
}

export default Location;
