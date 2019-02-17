'use strict';

import './integration.service';
import './dexi/dexiIntegration.component';

class IntegrationsCtrl {
    
    constructor(toaster, Auth, OrganisationService, IntegrationService) {
        /** @type {Auth} **/
        this.Auth = Auth;
        this.toaster = toaster;
        this.IntegrationService = IntegrationService;
        this.OrganisationService = OrganisationService;
        
        this.user = this.Auth.user;
        this.loadingIntegrations = false;
    }
    
    $onInit() {
        this.loadOrganisation();
        this.loadIntegrations();
    
        this.OrganisationService.on('updated', () => {
            this.loadOrganisation();
        });
    }
    
    loadOrganisation() {
        this.OrganisationService.load().then((organisation) => {
            this.organisation = organisation;
        });
    }
    
    loadIntegrations() {
        this.loadingIntegrations = true;
        
        this.IntegrationService.getAll().then(integrations => {
            this.integrations = integrations;
        }).finally(() => {
            this.loadingIntegrations = false;
        });
    }
}

truedashApp.component('appIntegrations', {
    controller: IntegrationsCtrl,
    templateUrl: 'content/profile/organisation/integrations/integrations.html',
});
