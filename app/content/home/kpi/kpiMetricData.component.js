'use strict';

import './kpi.service';
import {MetricModel} from '../../card/model/metric.model';

class KpiMetricDataCtrl {
    constructor(KpiService, CardFactory, $filter, DateRangeService, UserService, $scope, DeregisterService) {
        this.KpiService = KpiService;
        this.UserService = UserService;
        this.CardFactory = CardFactory;
        this.DateRangeService = DateRangeService;
        this.$filter = $filter;
        this.watchers = DeregisterService.create($scope);
        
        this.loading = false;
    }

    $onInit() {
        this.metric = new MetricModel(this.metric, null, {}, {}, this.UserService);
        
        this.loadMetricData();
        
        this.watchers.onRoot('kpi.refresh', () => this.loadMetricData(false));
    }
    
    loadMetricData(useCache = true) {
        this.loading = true;
    
        this.KpiService.getMetricData(this.metric, useCache).then((data) => {
            this.metricValue = data[this.period][0];
            this.compareValue = data[this.period][1];
        }).finally(() => {
            this.loading = false;
        });
    }
    
    get compareRangeLabel() {
        switch(this.period) {
            case 'yesterday':
                return 'same day last week';
                break;
            case 'today':
                return this.DateRangeService.getRangeLabelFromName('yesterday');
                break;
            case 'weekTY':
                return this.DateRangeService.getRangeLabelFromName('prevWeek');
                break;
            case 'monthTY':
                return this.DateRangeService.getRangeLabelFromName('prevMonth');
                break;
            case 'yearTY':
                return this.DateRangeService.getRangeLabelFromName('lastYear');
                break;
        }
    }
    
    get tooltipSentence() {
        return `Compared to ${this.compareRangeLabel} <br><br> <strong>${this.format(this.compareValue)}</strong>`;
    }
    
    get colorClass() {
        return {
            high: this.compareValue && this.isGood(),
            low: this.compareValue && this.isBad(),
        };
    }
    
    isGood() {
        let difference = this.metricValue - this.compareValue;
        let isIncrease = this.metric.isIncrease;
        
        return isIncrease && difference > 0 || !isIncrease && difference < 0;
    }
    
    isBad() {
        let difference = this.metricValue - this.compareValue;
        let isIncrease = this.metric.isIncrease;
    
        return isIncrease && difference < 0 || !isIncrease && difference > 0;
    }
    
    format(value) {
        if (this.metric) {
            let formatting = this.metric.getFormattingInfo();
    
            let params = {
                symbol: formatting.symbol,
                type: formatting.type
            };
            
            return value !== 0 ? this.$filter('value')(value, params, true, false, this.metric.numberOfDecimals) : 0;
        }
        
        return value;
    }
    
    getVariance() {
        if(!_.isNumber(this.compareValue)) return '-';
        
        let value = this.metricValue / this.compareValue * 100 - 100;
        
        return this.$filter('value')(value, {symbol: '%'}, false, !!value, this.metric.numberOfDecimals);
    }
    

}

truedashApp.component('appKpiMetricData', {
    controller: KpiMetricDataCtrl,
    templateUrl: 'content/home/kpi/kpiMetricData.html',
    bindings: {
        metric: '=',
        period: '@',
    },
});
