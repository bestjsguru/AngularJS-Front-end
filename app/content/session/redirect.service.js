"use strict";

class RedirectService {

    constructor($state, CacheService) {
        this.$state = $state;
        this.CacheService = CacheService;
    
        this.redirectTo = this.CacheService.getPermanent('redirectTo', {});
    }
    
    /**
     * @param {String} name
     * @param {{}} params
     */
    rememberCurrentState(name = this.$state.current.name, params = this.$state.params){
        if (!['login', 'logout', 'callback'].includes(name)) {
            this.redirectTo = this.CacheService.putPermanent('redirectTo', {state: name, params: params});
        }
    }
    
    hasRememberedState() {
        return !_.isEmpty(this.redirectTo);
    }

    restoreRememberedState(){
        if(this.hasRememberedState()){
            this.$state.go(this.redirectTo.state, this.redirectTo.params, {location: 'replace'});
            this.redirectTo = this.CacheService.putPermanent('redirectTo', {});
            
            return true;
        }

        return false;
    }
}

truedashApp.service('RedirectService', RedirectService);
