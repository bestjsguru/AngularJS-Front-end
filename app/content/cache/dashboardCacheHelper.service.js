'use strict';

import {Config} from '../config';

class DashboardCacheHelperService {
    constructor(CacheService) {
        this.CacheService = CacheService;
        this.dashboardsKey = "GET" + Config.baseUrl + "dashboard/all";
        this.dashboardCollectionKey = "GET" + Config.baseUrl + "dashboardCollection/findByUser";
    }

    addToCache(dashboard, folderId) {
        this.addToDashboards(dashboard);
        this.addToFolderList(dashboard, folderId);
    }

    removeFromCache(dashboard) {
        let {existingDashboard, dashboards} = this.getDashboard(dashboard.id);
    
        if (existingDashboard && dashboards) {
            dashboards.dashboards = _.without(dashboards.dashboards, existingDashboard);
            this.setDashboards(dashboards);
        }
    }

    getDashboards() {
        return this.CacheService.getCache(this.dashboardsKey, "cache");
    }

    setDashboards(value) {
        this.CacheService.put(this.dashboardsKey, value);
    }

    getDashboard(id, dashboards = this.getDashboards()) {
        let existingDashboard;

        if (dashboards) {
            existingDashboard = dashboards.dashboards.find(item => item.id === id);
        }

        return {existingDashboard, dashboards};
    }

    addToDashboards(dashboard) {
        let {existingDashboard, dashboards} = this.getDashboard(dashboard.id);

        if (!existingDashboard && dashboards) {
            dashboards.dashboards.push(dashboard);
            this.setDashboards(dashboards);
        }
    }

    addToFolderList(dashboard, folderId) {
        let dashboardCollection = this.CacheService.getCache(this.dashboardCollectionKey, "cache");

        if (dashboardCollection && folderId) {
            let folder = dashboardCollection.find(item => item.id === folderId);

            if (folder) {
                dashboard.active = true;
                dashboard.position = folder.dashboards.reduce((position, item) => {
                    return position < item.position ? item.position : position;
                }, 1) + 1;


                let existingDashboard = folder.dashboards.find(item => item.id === dashboard.id);

                if (!existingDashboard) {
                    folder.dashboards.push(dashboard);
                }
            }

            this.CacheService.put(this.dashboardCollectionKey, dashboardCollection);
        }
    }
    
    setDashboardLogo(dashboard, logo) {
        let {existingDashboard, dashboards} = this.getDashboard(dashboard.id);
    
        if (existingDashboard && dashboards) {
            existingDashboard.logo = logo;
    
            this.setDashboards(dashboards);
        }
    }
    
    clear() {
        this.CacheService.remove(this.dashboardsKey);
    }
}

truedashApp.service('DashboardCacheHelperService', DashboardCacheHelperService);
