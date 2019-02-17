'use strict';

import './mfa.service';

class MfaCtrl {
    constructor($scope, Auth, MfaService, DeregisterService, $state, RedirectService) {
        this.Auth = Auth;
        this.$state = $state;
        this.MfaService = MfaService;
        this.RedirectService = RedirectService;
    
        this.mfaToken = this.Auth.user.mfaToken;
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.initEnrollments();
    }
    
    initEnrollments() {
        this.loading = true;
        
        this.MfaService.getEnrollments().then(enrollments => {
            this.enrollments = enrollments;
        }).finally(() => {
            this.loading = false;
        });
    }
    
    logout() {
        console.log(this.$state);
        this.RedirectService.rememberCurrentState(this.$state.current.name, this.$state.params);
        
        this.Auth.logout();
    }
    
    remove(item) {
        this.loading = true;
    
        this.MfaService.deleteEnrollment(item.id).then(() => {
            this.enrollments = this.enrollments.filter(enrollment => enrollment.id !== item.id);
        }).finally(() => {
            this.loading = false;
        });
    }
    
    toggleMfa() {
        this.loading = true;
        
        this.MfaService.setMfa(!this.mfaToken).then(enrollments => {
            this.mfaToken = !this.mfaToken;
            this.enrollments = enrollments;
        }).finally(() => {
            this.loading = false;
        });
    }
}

truedashApp.component('appMfa', {
    controller: MfaCtrl,
    templateUrl: 'content/profile/details/mfa/mfa.html',
});





