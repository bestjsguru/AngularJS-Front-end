'use strict';

import ColorPickerConfig from '../../../common/colorPicker/colorPickerConfig';

class BulletSettingsCtrl {
    constructor($scope, DeregisterService) {
        this.watchers = DeregisterService.create($scope);
        
        this.ColorPickerConfig = new ColorPickerConfig();
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
    
    applySettings() {
        this.watchers.timeout(() => {
            this.card.chartSettings.init(this.settings);
        }, 100);
    }
    
    remove(range) {
        this.settings.bullet.valueRanges = _.without(this.settings.bullet.valueRanges, range);
    
        this.applySettings();
    }
    
    addRange() {
        this.settings.bullet.valueRanges.push({
            from: _.get(_.last(this.settings.bullet.valueRanges), 'to', ''),
            to: _.get(_.last(this.settings.bullet.valueRanges), 'to', ''),
            color: "#fff",
        });
    }
    
    removeColor(range) {
        range.color = null;
    
        this.applySettings();
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.chartSettings.off(null, null, this);
        this.card.columnPosition.off(null, null, this);
    }
}

truedashApp.component('appBulletSettings', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: BulletSettingsCtrl,
    templateUrl: 'content/builder/settings/bullet/bulletSettings.html'
});
