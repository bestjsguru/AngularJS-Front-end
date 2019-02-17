'use strict';

import {Config} from '../../config';
import {ROLES} from './../../common/data/RolesHelper';

class InviteOrganisationMembersCtrl {
    constructor($scope, OrganisationService, toaster, FolderSettingsService, Auth) {
        this.$scope = $scope;
        /** @type {OrganisationService} **/
        this.OrganisationService = OrganisationService;
        this.toaster = toaster;
        this.roles = Config.user.roles;
        /** @type {FolderSettingsService} **/
        this.FolderSettingsService = FolderSettingsService;
        /** @type {Auth} **/
        this.Auth = Auth;

        this.personalMessage = false;
        this.tab = 'existing';
        this.forms = [];
    }

    $onInit() {
        this.reset();
    }

    showHidePersonalMessageInput() {
        this.personalMessage = !this.personalMessage;
    }

    isShown(role) {
        return role.id !== ROLES.ROLE_EXTERNAL_USER;
    }

    add(role) {
        this.validateFormFields();

        if (!this.$scope.forms.members_form.$invalid) {
            // Remove any unnecessary spaces from email string and convert to array
            let emails = this.members.emails.replaceAll(' ', '').split(',');

            this.FolderSettingsService.applyByRole(role).then(({role, list, groups, access}) => {
                emails.forEach((email) => {
                    this.OrganisationService.inviteUser(email, this.members.message, list, groups, role.id, access).then(() => {
                        this.toaster.success('Invite sent to ' + email);
                    }).catch(()=> {
                        this.toaster.error('There was an error while sending invite to ' + email);
                    });
                });
            });
        }
    }

    reset(){
        this.members = {};
    }

    // Function that will trigger validation on all supplied fields for a form
    validateFormFields() {
        ['emails'].forEach((formControl) => {
            // Skip valid fields
            if (this.$scope.forms.members_form[formControl].$dirty && this.$scope.forms.members_form[formControl].$valid) return;

            // Mark all fields as dirty because that will trigger validation
            this.$scope.forms.members_form[formControl].$dirty = true;
            this.$scope.forms.members_form[formControl].$pristine = false;
        });

        this.submitted = true;
    }
}

truedashApp.directive('tuInviteMembers', () => {
    return {
        controller: InviteOrganisationMembersCtrl,
        controllerAs: 'inviteMembers',
        restrict: 'EA',
        scope: true,
        require:'tuProfileDetails',
        templateUrl: 'content/profile/organisation/inviteMembers.html'
    };
});
