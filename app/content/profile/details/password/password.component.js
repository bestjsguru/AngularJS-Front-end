'use strict';

import './password.service';

class PasswordCtrl {
    constructor(PasswordService, toaster) {
        this.PasswordService = PasswordService;
        this.toaster = toaster;
    }
    
    $onInit() {
        this.initData();
        this.submitting = false;
    }
    
    save() {
        // Skip if saving is already in progress
        if(this.submitting) return;
        
        this.submitting = true;
    
        // Mark some fields as dirty because that will re-trigger validation
        ['oldPassword', 'password', 'passwordConfirm'].forEach(field => {
            this.form[field].$dirty = true;
            this.form[field].$pristine = false;
        });
    
        // Don't submit if form is invalid
        if (this.form.$invalid || !this.userData.oldPassword || !this.userData.password) {
            this.submitting = false;
            return;
        }
        
        let params = {
            oldPassword: this.userData.oldPassword,
            password: this.userData.password,
        };
        
        return this.PasswordService.change(params).then(() => {
            this.toaster.success('Password changed');
            this.initData();
        }).catch(() => {
            this.toaster.error('Your original password is not correct');
        }).finally(() => {
            this.submitting = false;
        });
        
    }
    
    dirty(field) {
        return this.submitting || field.$dirty;
    }
    
    initData() {
        this.userData = {
            firstName: window.Auth.user.firstName,
            lastName: window.Auth.user.lastName,
            email: window.Auth.user.email,
        };
    
        this.form && this.form.$setPristine(true);
    }
}

truedashApp.component('appPassword', {
    controller: PasswordCtrl,
    templateUrl: 'content/profile/details/password/password.html',
});





