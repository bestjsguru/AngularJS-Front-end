'use strict';

import DashboardTheme from './dashboardTheme.model';

class DashboardThemeService {
    constructor(DataProvider, UserCacheHelperService, DashboardCacheHelperService) {
        this.DataProvider = DataProvider;
        this.UserCacheHelperService = UserCacheHelperService;
        this.DashboardCacheHelperService = DashboardCacheHelperService;
    }
    
    create(data) {
        return new DashboardTheme(data);
    }
    
    saveTheme(id, theme) {
        let themeSettings = theme.getJson();
    
        if(themeSettings.colors.useOrganisationChartColors) {
            delete themeSettings.colors.chart;
        }
        
        return this.DataProvider.post('dashboard/saveTheme/' + id, {themeSettings}, false);
    }
    
    updatePicture(dashboard) {
        return this.DataProvider.postWithUpload('dashboard/addLogo', {id: dashboard.id}, dashboard.logoFile).then((response) => {
            dashboard.setLogo(response.filePath || '');
        });
    }
    
    removePicture(dashboard) {
        return this.DataProvider.get('dashboard/removeLogo/' + dashboard.id, null, false).then(() => {
            dashboard.setLogo('');
        });
    }
}

truedashApp.service('DashboardThemeService', DashboardThemeService);
