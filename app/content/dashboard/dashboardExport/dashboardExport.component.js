'use strict';

class DashboardExportController {
    constructor(DashboardCollection, Auth, $scope, DeregisterService, DataExportService) {
        this.Auth = Auth;
        this.DataExportService = DataExportService;
        this.DashboardCollection = DashboardCollection;
        this.watchers = DeregisterService.create($scope);

        this.user = this.Auth.user;

        this.type = 'pdf';
        this.cards = [];
        this.selectedCards = [];
        this.snapshot = true;
    }
    
    $onInit() {
        this.dashboard = this.resolve.dashboard;
        this.availableDashboardFilters = this.resolve.availableDashboardFilters;
    
        this.watchers.watch('$ctrl.dashboard.loaded', loaded => loaded && this.initiateCards());
        
        if(this.dashboard.cards.loaded) {
            this.initiateCards();
        }
    }
    
    initiateCards() {
        this.cards = this.dashboard.cards.items.filter(card => card.active).slice();
        this.selectedCards = this.dashboard.cards.items.filter(card => card.active).slice();
    
        if(['csv', 'excel'].includes(this.type)) {
            this.removeImageAndTextCards();
        }
    }
    
    submit() {
        let params = {
            cardIds: this.getSelectedCards().map(card => card.id),
            organisationId: this.user.organisation.id,
            dashboardId: this.dashboard.id,
            dashboard: {
                id: this.dashboard.id,
                name: this.dashboard.name,
            },
            snapshot: this.snapshot,
            exportType: this.type,
        };
        
        this['exportTo' + this.type.toUpperCase()](params);
        
        this.dismiss();
    }
    
    changeType(type) {
        this.type = type;
        this.cards = this.dashboard.cards.items.filter(card => card.active).slice();
        
        if(this.canUseSnapshot()) {
            this.snapshot = true;
            this.selectedCards = this.dashboard.cards.items.filter(card => card.active).slice();
        } else {
            this.snapshot = false;
            
            if(['csv', 'excel'].includes(this.type)) {
                this.removeImageAndTextCards();
            }
        }
    }
    
    removeImageAndTextCards() {
        this.cards = this.dashboard.cards.items.filter(card => card.active).slice().filter(card => {
            return !card.isImageOrDraft() && !card.isText();
        });
        this.selectedCards = this.getSelectedCards().filter(card => {
            return !card.isImageOrDraft() && !card.isText();
        }).slice();
    }
    
    canUseSnapshot() {
        return ['pdf'].includes(this.type);
    }
    
    canSelectCards() {
        return ['pdf', 'ppt', 'csv', 'excel'].includes(this.type);
    }
    
    setSnapshot(value) {
        if(!this.canUseSnapshot()) return;
        
        this.snapshot = value;
    
        if(this.snapshot) {
            this.selectedCards = this.dashboard.cards.items.filter(card => card.active).slice();
        }
    }
    
    getSelectedCards() {
        return this.selectedCards || [];
    }
    
    exportToPDF(params) {
        params.withDashboardFilters = this.availableDashboardFilters.dashboardFilters && this.availableDashboardFilters.isAppliedAtLeastOnce;
        
        return this.DataExportService.exportDashboard(params);
    }
    
    exportToPPT(params) {
        params.withDashboardFilters = this.availableDashboardFilters.dashboardFilters && this.availableDashboardFilters.isAppliedAtLeastOnce;
        
        return this.DataExportService.exportDashboardToPowerpoint(params);
    }
    
    exportToCSV(params) {
        params.withDashboardFilters = this.availableDashboardFilters.dashboardFilters && this.availableDashboardFilters.isAppliedAtLeastOnce;
        
        return this.DataExportService.exportDashboardToCsv(params);
    }
    
    exportToEXCEL(params) {
        params.withDashboardFilters = this.availableDashboardFilters.dashboardFilters && this.availableDashboardFilters.isAppliedAtLeastOnce;
    
        return this.DataExportService.exportDashboardToExcel(params);
    }
}

truedashApp.component('appDashboardExport', {
    controller: DashboardExportController,
    templateUrl: 'content/dashboard/dashboardExport/dashboardExport.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
