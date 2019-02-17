'use strict';

import DrillContextMenu from '../drillContextMenu';

class DrillPresetsCtrl extends DrillContextMenu {
    constructor($scope, $element, $document, $filter, DeregisterService) {
        super('.drill-presets');
        
        this.$filter = $filter;
        this.$element = $element;
        this.$document = $document;
        this.watchers = DeregisterService.create($scope);
    
        this.loading = false;
        this.isVisible = false;
    }

    $onInit() {
        this.card.drill.on('showPresets', this.showPresets, this);
        
        this.closeOnClick();
    }
    
    showPresets(params) {
        this.show();
    
        this.params = params;
        this.position = params.position;
        this.metric = this.getMetric(params.metric);
        
        if(this.metric) {
            this.fitToScreen();
        }
    }
    
    selectPreset(preset) {
        this.card.drill.presets.select(preset, this.params);
        
        this.hide();
    }
    
    getMetric(metric) {
        return this.card.metrics.getDataSetById(metric.id);
    }
    
    close() {
        this.card.drill.trigger('showDropdown', this.params);
        
        this.hide();
    }
    
    $onDestroy() {
        this.card.drill.off(null, null, this);
    }
}

truedashApp.component('appDrillPresets', {
    controller: DrillPresetsCtrl,
    templateUrl: 'content/card/expand/drill/presets/drillPresets.html',
    bindings: {
        card: '='
    }
});
