'use strict';

class OrganisationEmbedCtrl {
    
    constructor(toaster, Auth, OrganisationService) {
        /** @type {Auth} **/
        this.Auth = Auth;
        this.toaster = toaster;
        this.OrganisationService = OrganisationService;

        this.submitting = false;
    
        this.user = this.Auth.user;
    
        this.enabled = [
            { value: true, label: 'Enabled'},
            { value: false, label: 'Disabled'},
        ];
    }
    
    $onInit() {
        this.loadOrganisation();
    
        this.OrganisationService.on('updated', () => {
            this.loadOrganisation();
        });
    }
    
    loadOrganisation() {
        this.OrganisationService.load().then((organisation) => {
            this.organisation = organisation;
        
            this.enabled.selected = this.enabled.find(item => item.value === this.organisation.embeddingEnabled);
        });
    }

    save() {
        // Mark some fields as dirty because that will re-trigger validation
        ['secret'].forEach(field => {
            this.form[field].$dirty = true;
            this.form[field].$pristine = false;
        });
        
        // Check if anything is changed in order to submit form. Otherwise do nothing
        if (!this.form.$valid || this.submitting) return;

        this.submitting = true;
        
        this.organisation.embeddingEnabled = this.enabled.selected.value;
    
        return this.OrganisationService.update(this.organisation).then(() => {
            this.toaster.success('Organisation details saved');
        }).catch(() => {
            this.toaster.error('Failed to update info. Please try again');
        }).finally(() => {
            this.submitting = false;
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

truedashApp.component('appOrganisationEmbed', {
    controller: OrganisationEmbedCtrl,
    templateUrl: 'content/profile/organisation/embed/organisationEmbed.html',
});
