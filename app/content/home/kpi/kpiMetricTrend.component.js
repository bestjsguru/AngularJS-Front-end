'use strict';

import './kpi.service';
import '../../card/highchart/sparkline/sparkline.component';
import HighchartConfig from '../../card/highchart/highchart.config';

class KpiMetricTrendCtrl {
    constructor(KpiService, CardFactory, $filter, $scope, DeregisterService) {
        this.KpiService = KpiService;
        this.CardFactory = CardFactory;
        this.$filter = $filter;
        this.watchers = DeregisterService.create($scope);
        
        this.loading = false;
    }

    $onInit() {
        this.loadMetricTrend();
    
        this.watchers.onRoot('kpi.refresh', () => this.loadMetricTrend(false));
    }
    
    loadMetricTrend(useCache = true) {
        this.loading = true;
    
        this.data = {};
        
        this.KpiService.getMetricTrend(this.metric, useCache).then(data => {
            this.data = data;
        }).catch(angular.noop).finally(() => {
            this.loading = false;
        });
    }
    
    hasData() {
        return this.data && this.data.trend;
    }
    
    get trendValue() {
        return this.$filter('value')(this.data.value, {symbol: this.data.symbol}, true, true, this.metric.numberOfDecimals) + '/' + this.data.period;
    }
    
    get trendColor() {
        return this.data.isGood ? HighchartConfig.colors.green : HighchartConfig.colors.red;
    }
}

truedashApp.component('appKpiMetricTrend', {
    controller: KpiMetricTrendCtrl,
    templateUrl: 'content/home/kpi/kpiMetricTrend.html',
    bindings: {
        metric: '=',
    },
});
