'use strict';

import './validEmailDomain.directive';
import {Config} from '../../../config';

class OrganisationInfoCtrl {
    
    constructor($state, $q, toaster, Auth, $rootScope, DeregisterService, $scope, OrganisationService) {
        this.$q = $q;
        /** @type {Auth} **/
        this.Auth = Auth;
        this.$state = $state;
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.OrganisationService = OrganisationService;

        this.submitting = false;
    
        this.user = this.Auth.user;
    
        this.decimals = [
            { value: 0, label: 'No decimal places'},
            { value: 1, label: '1 decimal place'},
            { value: 2, label: '2 decimal places'},
            { value: 3, label: '3 decimal places'},
            { value: 4, label: '4 decimal places'},
            { value: 5, label: '5 decimal places'},
            { value: 6, label: '6 decimal places'},
        ];
        
        this.days = [
            { value: 1, label: 'Monday'},
            { value: 2, label: 'Tuesday'},
            { value: 3, label: 'Wednesday'},
            { value: 4, label: 'Thursday'},
            { value: 5, label: 'Friday'},
            { value: 6, label: 'Saturday'},
            { value: 7, label: 'Sunday'},
        ];
    
        this.decimals.selected = this.decimals[this.user.organisation.numberOfDecimals];
        this.days.selected = this.days[this.user.organisation.startDayOfWeek - 1];
        
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.OrganisationService.load().then((organisation) => {
            this.organisation = organisation;
        });
    }
    
    onStartDayChange() {
        this.organisation.startDayOfWeek = this.days.selected.value;
    }
    
    onDecimalsChange() {
        this.organisation.numberOfDecimals = this.decimals.selected.value;
    }

    isFormPictureChanged() {
        return !!this.organisation.logoFile;
    }

    save() {
        // Check if anything is changed in order to submit form. Otherwise do nothing
        if (!(this.form.$valid || this.isFormPictureChanged()) || this.submitting) return;

        this.submitting = true;

        let picturePromise = this.isFormPictureChanged() ? this.savePicture() : true;
        
        this.$q.all([this.saveFormData(), picturePromise]).finally(() => {
            this.$rootScope.$broadcast('organisation.logo.updated');
            this.Auth.user.organisation.numberOfDecimals = this.organisation.numberOfDecimals;
            
            this.Auth.trigger('updated');
            this.submitting = false;
        });
    }

    saveFormData() {
        return this.OrganisationService.update(this.organisation).then(() => {
            this.toaster.success('Organisation details saved');
        }).catch(() => {
            this.toaster.error('Failed to update info. Please try again');
        });
    }

    savePicture() {
        return this.OrganisationService.updatePicture(this.organisation).then(() => {
            this.toaster.success('Organisation logo saved');
        }).catch(() => {
            this.toaster.error('Failed to update logo. Please try again');
        });
    }
    
    useDefaultLogo() {
        return this.OrganisationService.removePicture(this.organisation).then(() => {
            this.$rootScope.$broadcast('organisation.logo.updated');
            this.Auth.trigger('updated');
            this.toaster.success('Organisation logo removed');
        }).catch(() => {
            this.toaster.error('Failed to remove logo. Please try again');
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

    userCanEdit(){
        return this.user.isAdmin();
    }
}

truedashApp.component('appOrganisationInfo', {
    controller: OrganisationInfoCtrl,
    templateUrl: 'content/profile/organisation/info/organisationInfo.html',
});
