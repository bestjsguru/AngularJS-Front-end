'use strict';

import {MetricModel} from './metric.model.js';
import {Collection} from '../../data/collection.js';

export class MetricCollection extends Collection {
    constructor(DataProvider, DateRangeService, Auth, UserService) {
        super();
        /** @type {DataProvider} */
        this.DataProvider = DataProvider;
        /** @type DateRangeService */
        this.DateRangeService = DateRangeService;
        this.Auth = Auth;
        this.UserService = UserService;
    }

    /**
     * Create metric model object
     * @todo: what about split each kind of metric by classes and use factory instead of collection's method
     *
     * @param json
     * @param [dataset]
     * @returns {MetricModel}
     * @param DateRangeService
     * @param Auth
     * @param UserService
     */
    static create(json, dataset, DateRangeService, Auth, UserService) {
        return new MetricModel(json, dataset, DateRangeService, Auth, UserService);
    }

    add(json, dataset) {
        let metric = MetricCollection.create(json, dataset, this.DateRangeService, this.Auth, this.UserService);
        this.items.push(metric);
        this.trigger('added', metric);
        return metric;
    }

    clear() {
        super.clear();
        this.trigger('clear');
    }

    getVisibleMetrics(metrics) {
        metrics = metrics || this.items;
        return metrics.filter(metric => !metric.isHidden());
    }

    getVisibleCount() {
        return this.getVisibleMetrics().length;
    }

    remove(metric) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (metric.id !== this.items[i].id) continue;
            this.items.splice(i, 1);
            this.trigger('removed', metric);
            break;
        }
    }

    isCohort() {
        return this.items.some(metric => metric.isCohort());
    }

    getByRawId(id) {
        return this.items.find(metric => metric.rawId == id);
    }

    getByRelationId(id) {
        return this.items.find(metric => metric.isRegular() && metric.relationId == id);
    }

    getByFormulaId(id) {
        return this.items.find(metric => metric.isFormula() && metric.formulaId == id);
    }

    getByCompareId(id) {
        return this.items.find(metric => metric.isComparable() && metric.rawId == id);
    }
    
    getByVirtualId(id) {
        return this.items.find(metric => parseInt(metric.virtualId) === parseInt(id));
    }

    getNonEmptyMetrics() {
        return this.filter((metric) => {
            var metricData = metric.getData();
            return metricData.total || metricData.length >= 0;
        });
    }
    
    sortMetricsBy(metrics, column) {
        return metrics.sort((a, b) => {
            a = a[column];
            b = b[column];
            
            if(!a){
                return 1;
            }
            
            if(!b){
                return -1;
            }
            
            return a.localeCompare(b);
        });
    }
    
    sortMetricsBySource(metrics) {
        return this.sortMetricsBy(metrics, 'source');
    }

    getMetricsGroupedBySource(metrics) {

        let sources = {};

        metrics.forEach(metric => {
            let sourceName = metric.source;
            let existingSource = sources[sourceName];

            if(existingSource) {
                existingSource.metrics.push(metric);
            } else {
                sources[sourceName] = {
                    name: sourceName,
                    collapsed: true,
                    hasNoSource: !sourceName,
                    metrics: [metric]
                };
            }
        });

        // Sort all metrics alphabetically
        return _.values(sources).map(source => {
            source.metrics.sort((a, b) => a.label.localeCompare(b.label));

            return source;
        });
    }
}
