'use strict';

import {Config} from '../config';

class OrganisationCacheHelperService {
    constructor(CacheService) {
        this.CacheService = CacheService;
        this.organisationInfoKey = "GET" + Config.baseUrl + "organisation/info";
    }

    setOrganisationInfo(value) {
        this.CacheService.put(this.organisationInfoKey, value);
    }

    setOrganisationLogo(logo) {
        let details = this.CacheService.get(this.organisationInfoKey);
        
        if(details) {
            details.logo = logo;
        }
        
        this.CacheService.put(this.organisationInfoKey, details);
    }

    clear() {
        this.CacheService.remove(this.organisationInfoKey);
    }
}

truedashApp.service('OrganisationCacheHelperService', OrganisationCacheHelperService);
