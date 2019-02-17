'use strict';

class UserCacheHelperService {
    constructor(CacheService) {
        this.CacheService = CacheService;
        this.userDetailsKey = "user";
    }

    getUserDetails() {
        return this.CacheService.getPermanent(this.userDetailsKey, "cache");
    }

    setUserDetails(value) {
        this.CacheService.putPermanent(this.userDetailsKey, value);
    }

    setOrganisationDetails(organisation) {
        let userDetails = this.getUserDetails();

        if (userDetails && userDetails.organisation) {
            userDetails.organisation = organisation;
            this.setUserDetails(userDetails);
        }
    }
    
    setOrganisationLogo(logo) {
        let userDetails = this.getUserDetails();

        if (userDetails && userDetails.organisation) {
            userDetails.organisation.logo = logo;
            this.setUserDetails(userDetails);
        }
    }
}

truedashApp.service('UserCacheHelperService', UserCacheHelperService);
