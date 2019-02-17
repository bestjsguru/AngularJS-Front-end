'use strict';

import './breadcrumbs/drillBreadcrumbs.component';
import './records/header/drillRecordsHeader.component';
import './records/columns/drillRecordsColumns.component';
import './dropdown/drillDropdown.component';
import './columns/drillColumns.component';
import './presets/drillPresets.component';
import './type/drillType.component';
import './actions/drillActions.component';

class DrillCardCtrl {
    constructor($scope, AppEventsService, DeregisterService) {
        this.AppEventsService = AppEventsService;
        
        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        this.initCard();
    }
    
    initCard(useCache = true) {
        this.card && this.card.drill.off(null, null, this);
        
        this.card = null;
    
        return this.watchers.timeout(() => {
            this.card = this.originalCard.clone();
            if(useCache) this.card.loadDataFromCache = true;
    
            this.card.drill.withDashboardFilters = !!this.originalCard.cardUpdateModel;
            
            return this.card.metrics.loadData(true, this.card.drill.withDashboardFilters).then(() => {
                this.card.enterDrillMode();
        
                this.AppEventsService.track('used-drill-mode');
    
                this.card.drill.on('reset', (preset) => {
                    this.initCard(true).then(() => {
                        preset && this.card.drill.presets.activate(preset);
                    });
                }, this);
            });
        }, 100);
    }
    
    isError() {
        return this.card && this.card.metrics.error;
    }
    
    reload() {
        this.card.autoReload.saveState();
        this.card.autoReload.enable();
    
        this.card.metrics.loadData(false, this.card.drill.withDashboardFilters).finally(() => {
            this.card.autoReload.rollback();
        });
    }
    
    getType() {
        if (!this.card) return;
        
        return this.card.types.subType;
    }
    
    $onDestroy() {
        this.card.drill.off(null, null, this);
        this.card.drill.presets.invalidate();
        
        this.card.exitDrillMode();
    }
}

truedashApp.component('appDrillCard', {
    controller: DrillCardCtrl,
    templateUrl: 'content/card/expand/drill/drillCard.html',
    bindings: {
        originalCard: '<',
    }
});
