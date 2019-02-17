'use strict';

class TreemapSettingsCtrl {
    constructor($scope, DeregisterService) {
        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        this.card = this.cardBuilder.card;
        this.settings = this.card.chartSettings.getJson();
        
        this.card.chartSettings.on('loaded', () => {
            this.settings = this.card.chartSettings.getJson();
        }, this);
    }
    
    get loading() {
        return this.card.metrics.loading;
    }
    
    setAlgorithm(algorithm) {
        this.settings.treemap.layoutAlgorithm = algorithm;
        
        this.applySettings();
    }
    
    setLayout(layout) {
        this.settings.treemap.layoutStartingDirection = layout;
        
        this.applySettings();
    }
    
    applySettings() {
        this.watchers.timeout(() => {
            this.card.chartSettings.init(this.settings);
        }, 100);
    }
    
    $onDestroy() {
        this.card.chartSettings.off(null, null, this);
    }
}

truedashApp.component('appTreemapSettings', {
    controller: TreemapSettingsCtrl,
    templateUrl: 'content/builder/settings/treemap/treemapSettings.html',
    require: {
        cardBuilder: '^appBuilder',
    },
});
