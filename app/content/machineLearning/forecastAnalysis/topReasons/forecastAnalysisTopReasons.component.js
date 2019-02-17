'use strict';

class ForecastAnalysisTopReasonsCtrl {

    constructor($filter, $rootScope) {
        this.$rootScope = $rootScope;
        this.$filter = $filter;
        
        this.topReasons = [];
    }

    $onInit() {
        this.topReasons = this.data.map(item => ({
            dimension: item.dimension,
            value: item.value,
            isIncrease: item.variance > 0,
            variance: this.$filter('value')(item.variance.toFixed(2), {symbol: this.forecastAnalysis.impacts.actual.symbol}, false),
            actual: this.$filter('value')(item.actual.toFixed(2), {symbol: this.forecastAnalysis.impacts.actual.symbol}, false),
            forecast: this.$filter('value')(item.forecast.toFixed(2), {symbol: this.forecastAnalysis.impacts.forecast.symbol}, false),
            percentage: this.$filter('value')(item.percentage * 100, {symbol: '%'}, false),
        }));
    }

    drillDown(item) {
        this.$rootScope.$broadcast('forecastAnalysisWaterfall.point.click', this.forecastAnalysis.impacts.actual, item.dimension, item.value);
    }
}

truedashApp.component('appForecastAnalysisTopReasons', {
    controller: ForecastAnalysisTopReasonsCtrl,
    templateUrl: 'content/machineLearning/forecastAnalysis/topReasons/forecastAnalysisTopReasons.html',
    require: {
        forecastAnalysis: '^appForecastAnalysis'
    },
    bindings: {
        data: '='
    }
});
