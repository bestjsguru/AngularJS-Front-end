'use strict';

class MixedSettingsCtrl {
    constructor($scope, DeregisterService) {
        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        this.card = this.cardBuilder.card;
    
        this.card.chartSettings.on('loaded', this.initSettings, this);
        this.card.columnPosition.on('loaded', this.initSettings, this);
        this.card.metrics.on('added clear removed loaded hide show', this.applySettings, this);
    
        this.initSettings();
    }
    
    initSettings() {
        this.settings = this.card.chartSettings.getJson();
    
        this.settings.metrics.sort((a, b) => {
            return this.getMetricIndex(a) - this.getMetricIndex(b);
        });
    }
    
    getMetricIndex(item) {
        let metric = this.card.metrics.find(metric => this.card.metrics.getMetricId(metric) === item.id);
        
        return this.card.columnPosition.findMetricIndex(metric);
    }
    
    get loading() {
        return this.card.metrics.loading;
    }
    
    hasVisibleMetrics() {
        return this.settings.metrics.filter(metric => !metric.hidden).length;
    }
    
    applySettings() {
        this.watchers.timeout(() => {
            this.card.chartSettings.init(this.settings);
        }, 100);
    }
    
    changeType(metric, type) {
        metric.chartType = type;
        
        this.applySettings();
    }
    
    toggleSymbol(metric) {
        metric.useSymbols = !metric.useSymbols;
        
        this.applySettings();
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.chartSettings.off(null, null, this);
        this.card.columnPosition.off(null, null, this);
    }
}

truedashApp.component('appMixedSettings', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: MixedSettingsCtrl,
    templateUrl: 'content/builder/settings/mixed/mixedSettings.html'
});
