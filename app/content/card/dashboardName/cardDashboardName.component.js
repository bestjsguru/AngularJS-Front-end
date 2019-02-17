'use strict';

class CardDashboardNameCtrl {
    constructor($q, $scope, $state, DashboardCollection, DeregisterService, DashboardFolderService) {
        this.$q = $q;
        this.$state = $state;
        this.DashboardCollection = DashboardCollection;
        this.watchers = DeregisterService.create($scope);
        this.DashboardFolderService = DashboardFolderService;
        
        this.folder = null;
        this.dashboard = null;
    }
    
    $onInit() {
        // Load all dashboards and folders in order to merge them and display nicely
        let promises = [this.DashboardFolderService.load(), this.DashboardCollection.load()];
    
        this.$q.all(promises).then(([folders, dashboards]) => {
            this.DashboardCollection.loadByCardId(this.card.id).then((dashboard) => {
                this.dashboard = dashboard;
    
                if (this.dashboard.inFolder) {
                    this.folder = folders.find(folder => folder.id == this.dashboard.inFolder);
                }
            });
        });
    }
    
    getPopoverHtml() {
        if (this.dashboard.inFolder) {
            return `<strong>${this.folder.title}</strong> > ${this.dashboard.name}`;
        }
    
        return this.dashboard.name;
    }
    
    goToDashboard() {
        this.$state.go('dashboard', {dashboardId: this.dashboard.id}, {reload: true});
    }
}

truedashApp.component('appCardDashboardName', {
    controller: CardDashboardNameCtrl,
    templateUrl: 'content/card/dashboardName/cardDashboardName.html',
    bindings: {
        card: '='
    }
});
