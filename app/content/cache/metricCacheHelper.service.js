'use strict';

import {Config} from '../config';

class MetricCacheHelperService {
    constructor(CacheService) {
        this.CacheService = CacheService;
        this.allMetricsKey = "GET" + Config.baseUrl + "metric/all";
    }

    addToDataSource(metric, dataSourceId) {
        this.addMetric(metric, this.allMetricsKey + '?datasourceId=' + dataSourceId);
    }
    
    updateInDataSource(metric, dataSourceId) {
        this.updateMetric(metric, this.allMetricsKey + '?datasourceId=' + dataSourceId);
    }

    removeFromDataSource(metric, dataSourceId) {
        this.removeMetric(metric, this.allMetricsKey + '?datasourceId=' + dataSourceId);
    }
    
    addMetric(metric, key = this.allMetricsKey) {
        let metrics = this.CacheService.get(key);
        if(!metrics || !_.isObject(metric)) return;
    
        metrics.push(metric);
        
        this.CacheService.put(key, metrics);
    }
    
    updateMetric(metric, key = this.allMetricsKey) {
        let metrics = this.CacheService.get(key);
        if(!metrics || !_.isObject(metric)) return;
    
        let existingMetric = metrics.find(item => item.id === metric.id);
        
        if(existingMetric) {
            existingMetric = _.assign(existingMetric, {
                active: metric.active,
            });
            
            this.CacheService.put(key, metrics);
        }
    }
    
    removeMetric(metric, key = this.allMetricsKey) {
        let metrics = this.CacheService.get(key);
        if(!metrics || !_.isObject(metric)) return;
        
        metrics = metrics.filter(item => item.id !== metric.id);
        
        this.CacheService.put(key, metrics);
    }
}

truedashApp.service('MetricCacheHelperService', MetricCacheHelperService);
