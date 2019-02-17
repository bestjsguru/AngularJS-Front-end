'use strict';

class CloneCardModalCtrl {
    constructor(card, dashboards, activeDashboard, cloneCardAction, DashboardFolderService) {
        this.loading = false;
        this.dashboards = [];
        this.handle = cloneCardAction;
        this.DashboardFolderService = DashboardFolderService;

        this.loadFolders(dashboards).then(() => {
            // This will be default dashboard if there is no active dashboard or it is full
            this.dashboard = this.dashboards.find(dashboard => !dashboard.reachedCardsLimit && !dashboard.isLocked());
    
            if (activeDashboard && !activeDashboard.isLocked() && !activeDashboard.reachedCardsLimit) {
                this.dashboard = activeDashboard;
            }
        });
        
        this.name = card.name;
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

    clone() {
        this.loading = true;
        this.handle(this.dashboard, this.name).finally(() => this.$dismiss());
    }
}

class CloneCardCtrl {
    constructor($uibModal, DashboardCollection, toaster, CardCacheHelperService, Auth, $rootScope) {
        this.toaster = toaster;
        this.$uibModal = $uibModal;
        this.$rootScope = $rootScope;
        this.Auth = Auth;
        this.cloneModal = false;
        /** @type {DashboardCollection} **/
        this.dashboardCollection = DashboardCollection;
        /** @type {CardCacheHelperService} **/
        this.CardCacheHelperService = CardCacheHelperService;
    }

    /** @private **/
    clone(dashboard, name){
        return this.card
            .duplicate(dashboard, name)
            .then(() => {
                this.CardCacheHelperService.resetMetricUsageCache(this.card.metricIds());
                this.$rootScope.$emit('dashboardFilters.update');
                this.toaster.success(`Card ${this.card.getName()} cloned`);
            }).catch(error => {
                this.toaster.error(error.message);
            });
    }

    openCloneDialog() {
        this.cloneModal && this.cloneModal.dismiss();
        this.cloneModal = this.$uibModal.open({
            templateUrl: 'content/card/clone/cloneCard.html',
            controller: CloneCardModalCtrl,
            controllerAs: '$ctrl',
            bindToController: true,
            size: 'md',
            resolve: {
                card: this.card,
                cloneCardAction: () => {
                    return this.clone.bind(this);
                },
                dashboards: () => this.dashboardCollection.loadUserDashboards().then(dashboards => {
                    return dashboards.filter(dashboard => dashboard.isOwner());
                }),
                activeDashboard: () => {
                    return this.dashboardCollection.getActiveDashboard();
                },
            },
        });
    }
}

truedashApp.directive('tuCloneCard', () => ({
    controller: CloneCardCtrl,
    controllerAs: '$ctrl',
    scope: true,
    bindToController: {
        card: '='
    },
    restrict: 'A'
}));
