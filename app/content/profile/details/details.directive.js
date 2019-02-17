'use strict';

import './mfa/mfa.component';
import './apiToken/apiToken.component';
import './social/social.component';
import './password/password.component';
import '../../timezonePicker/timezonePicker.component';
import Tabs from '../../common/tabs';

class DetailsCtrl {
    constructor(Auth, UserService, toaster, $q, $state, Token, AppEventsService) {
        this.Auth = Auth;
        this.UserService = UserService;
        this.AppEventsService = AppEventsService;
        this.toaster = toaster;
        this.$q = $q;
        this.$state = $state;
        this.Token = Token;
    
        this.tabs = new Tabs(['info', 'security']);
        this.tabs.activate(this.$state.params.tab);

        this.user = {};
        this.userData = {};
        this.submitting = false;
        this.locale = {value: "en", label: "English"};

        this.UserService.retreiveUserDetails(Auth.user.username, false).then((details) => {
            this.setupUserData(details);
            this.timezone = this.user.timezone;
        }).catch(() => {
            this.toaster.error('Something went wrong while trying to retrieve details. Please try again.');
        });
    }
    
    setTab(tab) {
        this.tabs.activate(tab);
        this.$state.go('.', {tab: tab}, {notify: false});
    }

    setupUserData(details) {
        this.user = this.UserService.create(details);
        this.userData = this.user.getData();
        this.userData.email = this.user.username;
        this.userData.photo = this.user.photo;
    }

    isFormPictureChanged() {
        return !!this.userData.picture;
    }

    saveUserData() {

        this.submitting = true;

        // Mark some fields as dirty because that will re-trigger validation
        ['firstName', 'lastName'].forEach(field => {
            this.form[field].$dirty = true;
            this.form[field].$pristine = false;
        });

        // Don't submit if form is invalid
        if (this.form.$invalid) {
            this.submitting = false;
            return;
        }

        return this.UserService.saveUserDetails(this.fetchFormData()).then(() => {
            this.Auth.user.firstName = this.fetchFormData().firstName;
            this.Auth.user.lastName = this.fetchFormData().lastName;
            this.Auth.user.fullName = this.Auth.user.getFullName();
            this.Auth.user.timezone = this.fetchFormData().timezone;
            
            return this.toaster.success('Details successfully saved.');
        }).catch(() => {
            this.toaster.error('Something went wrong while trying to save details. Please try again.');
        }).finally(() => {
            this.submitting = false;
        });
    }

    fetchFormData() {
        return {
            firstName: this.userData.firstName,
            lastName: this.userData.lastName,
            username: this.user.username,
            locale: this.locale.value,
            timezone: this.timezone,
            fullName: this.userData.firstName + ' ' + this.userData.lastName
        };
    }

    save() {
        // Skip if saving is already in progress
        if(this.submitting) return;

        this.submitting = true;

        let formPromise = this.saveUserData();
        let picturePromise = this.isFormPictureChanged() ? this.savePicture() : true;
        
        return this.$q.all([formPromise, picturePromise]).then(() => {
            this.Auth.trigger('updated');
        }).catch(() => {
            this.toaster.error('Something went wrong. Please try again.');
        }).finally(() => {
            this.submitting = false;
        });

    }

    savePicture() {
        return this.UserService.savePicture(this.userData.picture, this.Auth.user).then((response) => {
            this.userData.picture = null;
            this.Auth.user.photo = response.filePath;
    
            this.AppEventsService.track('added-profile-photo');
            return this.toaster.success('User picture saved successfully');
        }).catch(() => {
            this.toaster.error('Failed to update picture. Please try again');
        });
    }

    /**
     * Check if form field is dirty
     *
     * @param field
     * @returns boolean
     */
    dirty(field) {
        return this.submitting || field.$dirty;
    }
}

truedashApp.directive('tuProfileDetails', () => {
    return {
        restrict: 'E',
        bindToController: true,
        controllerAs: 'details',
        controller: DetailsCtrl,
        templateUrl: 'content/profile/details/details.html'
    }
});
