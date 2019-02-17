'use strict';

class DrillSaveController {
    constructor(DashboardCollection, DashboardFolderService, CardCacheHelperService, toaster) {
        this.toaster = toaster;
        this.DashboardCollection = DashboardCollection;
        this.DashboardFolderService = DashboardFolderService;
        this.CardCacheHelperService = CardCacheHelperService;
    }
    
    $onInit() {
        this.loading = false;
        this.dashboards = [];
        this.card = this.resolve.card;
    
        this.DashboardCollection.loadUserDashboards().then(dashboards => {
            return dashboards.filter(dashboard => dashboard.isOwner());
        }).then(dashboards => {
            this.loadFolders(dashboards).then(() => {
                // This will be default dashboard if there is no active dashboard or it is full
                this.dashboard = this.dashboards.find(dashboard => !dashboard.reachedCardsLimit && !dashboard.isLocked());
                let activeDashboard = this.DashboardCollection.getActiveDashboard();
                
                if (activeDashboard && !activeDashboard.isLocked() && !activeDashboard.reachedCardsLimit) {
                    this.dashboard = activeDashboard;
                }
            });
        });
    
        this.name = this.card.name;
    }
    
    loadFolders(dashboards) {
        this.loading = true;
        
        return this.DashboardFolderService.load().then(folders => {
            this.dashboards = dashboards.filter(dashboard => {
                // Filter only dashboards in active folders
                return dashboard.inFolder ? folders.getById(dashboard.inFolder).active : true;
            }).map(dashboard => {
                dashboard.folderName = dashboard.inFolder ? folders.getById(dashboard.inFolder).title : '';
                
                return dashboard;
            });
            
            // Sort dashboards by name
            this.dashboards.sort((a, b) => {
               return a.name.localeCompare(b.name);
            });
        }).finally(() => {
            this.loading = false;
        });
    }
    
    select(dashboard) {
        this.dashboard = dashboard;
    }
    
    isSelected(dashboard) {
        return this.dashboard.id === dashboard.id;
    }

    save() {
        this.saving = true;
    
        this.card.name = this.name;
        this.card.dashboard = this.dashboard;
    
        this.card.doSave().then(() => {
            this.CardCacheHelperService.resetMetricUsageCache(this.card.metricIds());
            this.toaster.success('Card created');
            this.close();
        }).catch((error) => {
            this.toaster.error(error.message);
        }).finally(() => {
            this.saving = false;
        });
    }
}

truedashApp.component('appDrillSave', {
    controller: DrillSaveController,
    templateUrl: 'content/card/expand/drill/actions/save/drillSave.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
