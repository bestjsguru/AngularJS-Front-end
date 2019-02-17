'use strict';

import Tabs from '../../common/tabs';

class ChartSettingsController {
    constructor($scope, DeregisterService) {
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.card = this.resolve.card;
        this.tabs = new Tabs(['general', 'axisLeft', 'axisRight', 'metrics']);
        
        this.tabs.activate('general');
    
        this.saving = false;
        this.settings = this.card.chartSettings.getJson();
    }
    
    save() {
        this.saving = true;
        this.watchers.timeout(() => {
            this.card.chartSettings.init(this.settings);
            this.dismiss();
        }, 100);
    }
    
    customAxisRange(axis) {
        axis.range = true;
        axis.autoScale = false;
    }
    
    autoScaleAxisRange(axis) {
        axis.autoScale = true;
        axis.range = false;
        delete axis.rangeFrom;
        delete axis.rangeTo;
    }
    
    toggleMetricAxis(metric) {
        metric.leftYAxis = !metric.leftYAxis;
    }
    
    toggleLegend() {
        this.settings.legend.show = !this.settings.legend.show;
    }
    
    toggleValueLabels() {
        this.settings.valueLabels.show = !this.settings.valueLabels.show;
    }
    
    toggleSpiderChart() {
        this.settings.spider.enabled = !this.settings.spider.enabled;
    }
    
    toggleStacked() {
        this.settings.stacked = !this.settings.stacked;
    }
    
    toggleFillChart() {
        this.settings.fillChart = !this.settings.fillChart;
    }
    
}

truedashApp.component('appChartSettings', {
    controller: ChartSettingsController,
    templateUrl: 'content/builder/chartSettings/chartSettings.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
