'use strict';

class CardBuilderGeneralCtrl {
    constructor(AddDashboardModalService, DeregisterService, $scope) {
        this.AddDashboardModalService = AddDashboardModalService;
        this.watchers = DeregisterService.create($scope);
        
        this.card = undefined;
    }

    $onInit() {
        this.card = this.cardBuilder.card;
        this.userDashboards = this.cardBuilder.userDashboards;
    
        // Sort dashboards by name
        this.userDashboards.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        this.selectedDashboard = this.userDashboards.filter(dashboard => dashboard.id === this.card.dashboard.id);
        if(!this.selectedDashboard.length) this.selectedDashboard = [this.userDashboards[0]];
    
        this.watchers.watch('$ctrl.selectedDashboard', () => {
            this.card.dashboard = this.selectedDashboard[0];
        });
    }

    $onDestroy() {
        this.card.types.off(null, null, this);
    }

    getSetFrequency(freq) {
        if (!freq) return this.card.frequencies.selected;
        this.card.frequencies.set(freq);
    }
    
    createDashboard() {
        this.AddDashboardModalService.open();
    }
}

truedashApp.component('appCardBuilderGeneral', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: CardBuilderGeneralCtrl,
    templateUrl: 'content/builder/settings/general/cardBuilderGeneral.html'
});
