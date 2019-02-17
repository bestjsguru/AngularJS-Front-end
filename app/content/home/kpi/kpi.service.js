class KpiService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    getMetrics() {
        return this.DataProvider.get('kpi/metrics', {}, false);
    }
    
    selectMetrics(metrics) {
        let params = {
            selected: metrics.map(metric => metric.id),
        };
        
        return this.DataProvider.post('kpi/selectMetrics', params);
    }

    getMetricTrend(metric, useCache = true) {
        return this.DataProvider.get('smartAlert/getMetricTrend/' + metric.id, {}, useCache);
    }

    getMetricData(metric, useCache = true) {
        return this.DataProvider.get('kpi/getData/' + metric.id, {}, useCache);
    }
}

truedashApp.service('KpiService', KpiService);
