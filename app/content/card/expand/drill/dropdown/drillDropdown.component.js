'use strict';

import DrillContextMenu from '../drillContextMenu';

class DrillDropdownCtrl extends DrillContextMenu {
    constructor($scope, $element, $document, DeregisterService, MetricDataService) {
        super('.drill-dropdown');
        
        this.$element = $element;
        this.$document = $document;
        this.MetricDataService = MetricDataService;
        this.watchers = DeregisterService.create($scope);
    
        this.columns = [];
        this.isVisible = false;
    }

    $onInit() {
        this.card.drill.on('showDropdown', this.showDropdown, this);
    
        this.closeOnClick();
    }
    
    showRecords() {
        this.card.drill.trigger('showRecordsColumns', this.params);
    
        this.hide();
    }
    
    showColumns() {
        this.card.drill.trigger('showColumns', this.params);
    
        this.hide();
    }
    
    showPresets() {
        this.card.drill.trigger('showPresets', this.params);
        
        this.hide();
    }
    
    presetDrill(column) {
        this.card.drill.trigger('presetDrill', this.params, column);
    
        this.hide();
    }
    
    selectPreset(preset) {
        this.card.drill.presets.select(preset, this.params);
    
        this.hide();
    }
    
    showDropdown(params) {
        this.show();
    
        this.params = params;
        this.position = params.position;
        this.value = params.value;
        this.groupings = params.groupings;
        this.metric = this.getMetric(params.metric);
        this.type = this.card.types.isMixed() ? this.card.chartSettings.metricChartType(params.metric.id) : this.card.types.subType;
    
        
        if(this.metric) {
            this.removeMetricNameFromValue();
    
            let metric = this.metric;
    
            if(this.metric.isComparable()) {
                metric = this.card.compare.getRelatedMetric(this.metric);
            }
    
            if(metric) {
                this.card.drill.presets.load();
                this.fitToScreen();
            }
        }
    }
    
    getMetric(metric) {
        return this.card.metrics.getDataSetById(metric.id);
    }
    
    removeMetricNameFromValue() {
        if(_.isString(this.value)) {
            this.value = this.value.replaceAll(this.metric.name + '-', '');
        }
    }
    
    $onDestroy() {
        this.card.drill.off(null, null, this);
    }
}

truedashApp.component('appDrillDropdown', {
    controller: DrillDropdownCtrl,
    templateUrl: 'content/card/expand/drill/dropdown/drillDropdown.html',
    bindings: {
        card: '='
    }
});
