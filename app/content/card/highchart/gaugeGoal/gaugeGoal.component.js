'use strict';

import {Helpers} from '../../../common/helpers';

class GaugeGoalCtrl {
    constructor($filter, Auth) {
        this.Auth = Auth;
        this.$filter = $filter;
    }
    
    $onInit() {
        this.card.metrics.on('added removed loaded updated', this.setValue, this);
        
        if(!this.card.isVirtual()) {
            this.card.metrics.getLoadPromise().then(() => {
                this.setValue();
            });
        } else {
            this.setValue();
        }
    }
    
    get goal() {
        return this.getFormattedValue(this.card.goal);
    }
    
    get isIncrease() {
        return this.metric && this.metric.isIncrease;
    }
    
    progressClass() {
        if(this.isIncrease && this.getValue() >= this.card.goal) return 'success';
        if(!this.isIncrease && this.getValue() <= this.card.goal) return 'success';
        
        return 'danger';
    }
    
    progressSentence() {
        let value = this.getFormattedValue(this.card.goal - this.getValue());
    
        if(this.getValue() === this.card.goal) {
            return `Goal achieved`;
        }
    
        if(!this.isIncrease && this.getValue() < this.card.goal) {
            return `${value} above goal`;
        }
        
        if(this.isIncrease && this.getValue() > this.card.goal) {
            value = this.getFormattedValue(this.getValue() - this.card.goal);
            return `${value} above goal`;
        }
        
        if(this.getValue() > this.card.goal) {
            value = this.getFormattedValue(this.getValue() - this.card.goal);
        }
        
        return `${value} to goal`;
    }
    
    setValue() {
        this.metric = this.getMetric();
        this.value = this.getFormattedValue(this.getValue());
    }
    
    getMetric() {
        // Get first visible metric
        return this.card.metrics.find(metric => !metric.isHidden());
    }
    
    getValue() {
        if(!this.card.metrics.loaded) return '';
        
        let value = 0;
        if(this.metric) {
            this.metric.getData().forEach(val => value += val[1]);
            
            value = Helpers.round(value, this.metric.numberOfDecimals);
        }
        
        return value;
    }
    
    getFormattedValue(value) {
        if(this.metric) {
            let formatting = this.metric.getFormattingInfo();
            
            let params = {
                symbol: formatting.symbol,
                type: formatting.type
            };
            
            return value !== 0 ? this.$filter('value')(value, params, false, false, this.metric.numberOfDecimals) : 0;
        }
        
        return value;
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }
}

truedashApp.component('appGaugeGoal', {
    controller: GaugeGoalCtrl,
    templateUrl: 'content/card/highchart/gaugeGoal/gaugeGoal.html',
    bindings: {
        card: '='
    }
});
