'use strict';

class ScatterSettingsCtrl {
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
        this.settings.scatter.dimension = dimension;
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
            if(!this.dimensions.find(dimension => dimension.id === _.get(this.settings.scatter.dimension, 'id'))) {
                this.settings.scatter.dimension = undefined;
            }
            
            if(!this.settings.scatter.dimension) this.selectDimension(this.dimensions[0]);
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
        if(this.settings.scatter) {
            if(this.settings.scatter.xAxisMetric) {
                this.settings.scatter.xAxisMetric = this.card.chartSettings.getJson().metrics.find(item => item.id === this.settings.scatter.xAxisMetric.id);
            }
            
            if(this.settings.scatter.yAxisMetric) {
                this.settings.scatter.yAxisMetric = this.card.chartSettings.getJson().metrics.find(item => item.id === this.settings.scatter.yAxisMetric.id);
            }
        }
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.groupings.off(null, null, this);
        this.card.chartSettings.off(null, null, this);
    }
}

truedashApp.component('appScatterSettings', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: ScatterSettingsCtrl,
    templateUrl: 'content/builder/settings/scatter/scatterSettings.html'
});
