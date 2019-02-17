'use strict';

import {Config} from '../../../config';

class HeaderLogoCtrl {
    constructor(OrganisationService, DeregisterService, $scope) {
        this.OrganisationService = OrganisationService;
        this.watchers = DeregisterService.create($scope);
    
        this.initLogo();
        
        this.watchers.onRoot('organisation.logo.updated', () => {
            this.initLogo();
        });
    }
    
    loadDefaultLogo() {
        this.showPoweredByLogo = false;
        this.logo = Config.organisation.defaultPhotoUrl;
    }
    
    loadOrganisationLogo(organisation) {
        // this.showPoweredByLogo = true;
        // this.poweredByLogo = Config.organisation.poweredByLogo;
        this.logo = organisation.logo;
    }
    
    initLogo() {
        this.OrganisationService.load().then((organisation) => {
            organisation.hasLogo() ? this.loadOrganisationLogo(organisation) : this.loadDefaultLogo();
        });
    }
}

truedashApp.component('appHeaderLogo', {
    controller: HeaderLogoCtrl,
    templateUrl: 'content/layout/header/logo/headerLogo.html'
});
