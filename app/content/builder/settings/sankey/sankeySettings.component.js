'use strict';

class SankeySettingsCtrl {
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
    
    selectFromDimension(dimension) {
        this.settings.sankey.fromDimension = dimension;
        this.applySettings();
    }
    
    selectToDimension(dimension) {
        this.settings.sankey.toDimension = dimension;
        this.applySettings();
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
            if(!this.dimensions.find(dimension => dimension.id === _.get(this.settings.sankey.fromDimension, 'id'))) {
                this.settings.sankey.fromDimension = undefined;
            }
            
            if(!this.settings.sankey.fromDimension) this.selectFromDimension(this.dimensions[0]);
            
            // If selected dimension is not in the list of available dimensions we remove it preselect default
            if(!this.dimensions.find(dimension => dimension.id === _.get(this.settings.sankey.toDimension, 'id'))) {
                this.settings.sankey.toDimension = undefined;
            }
            
            if(!this.settings.sankey.toDimension) this.selectToDimension(_.get(this.dimensions, '[1]', this.dimensions[0]));
        } else {
            this.dimensions = [];
            this.selectFromDimension(undefined);
            this.selectToDimension(undefined);
        }
    }
    
    applySettings() {
        this.watchers.timeout(() => {
            this.card.chartSettings.init(this.settings);
    
            this.refreshDropdowns();
        }, 100);
    }
    
    refreshDropdowns() {
        if(this.settings.sankey) {
            if(this.settings.sankey.metric) {
                this.settings.sankey.metric = this.card.chartSettings.getJson().metrics.find(item => item.id === this.settings.sankey.metric.id);
            }
        }
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.groupings.off(null, null, this);
        this.card.chartSettings.off(null, null, this);
    }
}

truedashApp.component('appSankeySettings', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: SankeySettingsCtrl,
    templateUrl: 'content/builder/settings/sankey/sankeySettings.html'
});
