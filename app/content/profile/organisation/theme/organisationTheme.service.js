'use strict';

import OrganisationTheme from './organisationTheme.model';

class OrganisationThemeService {
    constructor(DataProvider, UserCacheHelperService, OrganisationCacheHelperService) {
        this.DataProvider = DataProvider;
        this.UserCacheHelperService = UserCacheHelperService;
        this.OrganisationCacheHelperService = OrganisationCacheHelperService;
    }
    
    create(data) {
        return new OrganisationTheme(data);
    }
    
    saveTheme(theme) {
        let themeSettings = theme.getJson();
    
        if(themeSettings.colors.useDefaultChartColors) {
            delete themeSettings.colors.chart;
        }
        
        return this.DataProvider.post('organisation/saveTheme', {themeSettings}, false).then(response => {
            this.UserCacheHelperService.setOrganisationDetails(response);
            this.OrganisationCacheHelperService.setOrganisationInfo(response);
            
            return response;
        });
    }
}

truedashApp.service('OrganisationThemeService', OrganisationThemeService);
