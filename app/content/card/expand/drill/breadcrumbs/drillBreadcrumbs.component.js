'use strict';

import {DrillPresetModel} from '../presets/drillPreset.model';

class DrillBreadcrumbsCtrl{
    constructor($scope, $filter, DeregisterService) {
        this.$filter = $filter;
        
        this.watchers = DeregisterService.create($scope);
        this.preset = new DrillPresetModel();
    }

    $onInit() {
        this.dates = [];
        
        if(!this.card.frequencies.isTotalSelected()) {
            // In this case we know it's a time series chart and that first drill level will be a date
            this.initDrillDate();
    
            this.card.drill.on('drillDown', () => {
                if(this.card.drill.date) {
                    this.dates.selected = this.dates.find(date => date.from === this.card.drill.date.from);
                }
            }, this);
        }
    }
    
    remove(grouping) {
        // If we are removing any grouping other then last one we need to deactivate drill path
        if(this.card.drill.columnPosition(grouping.column) !== this.card.groupings.length) {
            this.card.drill.presets.deactivate();
        }
        
        this.card.drill.remove(grouping);
    
        if(this.card.groupings.length === this.card.drill.savedGroupings.items.length) {
            return this.exitPreset();
        }
        
        return this.card.metrics.loadData(true, this.card.drill.withDashboardFilters);
    }
    
    refresh() {
        this.watchers.timeout(() => {
            this.card.drill.trigger('drillDown');
            
            return this.card.metrics.loadData(true, this.card.drill.withDashboardFilters);
        });
    }
    
    initDrillDate() {
        let cardData = this.card.getJson();
    
        this.dates = this.card.frequencies.splitDateRangeToIntervals(cardData.fromDate, cardData.toDate);
    }
    
    selectDate(date) {
        this.card.autoReload.disable();
    
        this.card.drill.drillByDate(date);
    
        this.card.autoReload.enable();
    
        return this.card.metrics.loadData(true, this.card.drill.withDashboardFilters);
    }
    
    savePreset() {
        this.preset.cardId = this.card.id;
        this.preset.columns = this.card.groupings.map(grouping => grouping.column);
        
        this.card.drill.presets.save(this.preset).then(() => {
            if(this.preset.error) return;
            
            this.card.drill.presets.activateWithLastLevel(this.preset);
        });
    }
    
    exitPreset() {
        this.card.drill.trigger('reset');
    }
    
    $onDestroy() {
        this.card.drill.off(null, null, this);
    }
}

truedashApp.component('appDrillBreadcrumbs', {
    controller: DrillBreadcrumbsCtrl,
    templateUrl: 'content/card/expand/drill/breadcrumbs/drillBreadcrumbs.html',
    bindings: {
        card: '='
    }
});
