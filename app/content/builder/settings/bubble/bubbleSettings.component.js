'use strict';

class BubbleSettingsCtrl {
    constructor($scope, DeregisterService) {
        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        this.card = this.cardBuilder.card;
        this.settings = this.card.chartSettings.getJson();
        
        this.initDimensions();
        this.refreshDropdowns();
    
        this.card.chartSettings.on('loaded', () => {
            this.settings = this.card.chartSettings.getJson();
    
            this.refreshDropdowns();
        }, this);
        
        this.card.metrics.on('added clear removed loaded hide show', this.applySettings, this);
        this.card.groupings.on('added updated removed', this.initDimensions, this);
    }
    
    get loading() {
        return this.card.metrics.loading;
    }
    
    selectDimension(dimension) {
        this.settings.bubble.dimension = dimension;
        this.applySettings();
    }
    
    isDefaultDimension() {
        return (!this.card.groupings.length && this.card.frequencies.isTotalSelected()) || !this.card.frequencies.isTotalSelected();
    }
    
    hasVisibleMetrics() {
        return this.settings.metrics.filter(metric => !metric.hidden).length;
    }
    
    initDimensions() {
        if(this.card.groupings.length) {
            this.dimensions = this.card.groupings.map(item => {
                return {
                    id: item.column.id,
                    name: item.column.name,
                    dimensionName: item.name,
                };
            });
            
            // If selected dimension is not in the list of available dimensions we remove it preselect default
            if(!this.dimensions.find(dimension => dimension.id === _.get(this.settings.bubble.dimension, 'id'))) {
                this.settings.bubble.dimension = undefined;
            }
            
            if(!this.settings.bubble.dimension) this.selectDimension(this.dimensions[0]);
        } else {
            this.dimensions = [];
            this.selectDimension(undefined);
        }
    }
    
    applySettings() {
        this.watchers.timeout(() => {
            this.card.chartSettings.init(this.settings);
    
            this.refreshDropdowns();
        }, 100);
    }
    
    refreshDropdowns() {
        if(this.settings.bubble) {
            if(this.settings.bubble.xAxisMetric) {
                this.settings.bubble.xAxisMetric = this.card.chartSettings.getJson().metrics.find(item => item.id === this.settings.bubble.xAxisMetric.id);
            }
            
            if(this.settings.bubble.yAxisMetric) {
                this.settings.bubble.yAxisMetric = this.card.chartSettings.getJson().metrics.find(item => item.id === this.settings.bubble.yAxisMetric.id);
            }
            
            if(this.settings.bubble.zAxisMetric) {
                this.settings.bubble.zAxisMetric = this.card.chartSettings.getJson().metrics.find(item => item.id === this.settings.bubble.zAxisMetric.id);
            }
        }
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.groupings.off(null, null, this);
        this.card.chartSettings.off(null, null, this);
    }
}

truedashApp.component('appBubbleSettings', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: BubbleSettingsCtrl,
    templateUrl: 'content/builder/settings/bubble/bubbleSettings.html'
});
