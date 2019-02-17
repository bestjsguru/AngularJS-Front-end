"use strict";

import {FilterDTO} from '../metricFilters/dto/FilterDTO';

class CloneManagerService {

    /**
     *
     * @param {AvailableColumnsService} AvailableColumnsService
     * @param {MetricDataService} MetricDataService
     * @param {MetricFiltersFactory} MetricFiltersFactory
     */
    constructor(AvailableColumnsService, MetricDataService, MetricFiltersFactory, $q, toaster) {
        this.$q = $q;
        this.toaster = toaster;
        this.MetricDataService = MetricDataService;
        this.MetricFiltersFactory = MetricFiltersFactory;
        this.AvailableColumnsService = AvailableColumnsService;
    }

    /**
     * @param {MetricModel} metric
     * @param {MetricDataModel} data
     */
    clone(metric, data){
        let metricId = metric.id;

        metric.transformToClone();
        this.data = _.extend(data, {
            id: metric.id,
            name: metric.getName()
        });

        let newMetric;

        var result = this.$q.defer();

        let sourceFilterCollection = this.MetricFiltersFactory.create(metric);
        sourceFilterCollection.init().then(() => {

            let filtersList = _.sortBy(sourceFilterCollection.map((item) => {
                return FilterDTO.fromFilter(item, metric);
            }), filter => filter.chainLetter);

            return this.MetricDataService.clone(metric, data, filtersList);
        })
        .then((createdMetric) => {
            newMetric = createdMetric;
            result.notify({
                msg: `metric [${newMetric.id}] was created from source [${metricId}]`
            });
            return this.AvailableColumnsService.cloneIntoMetric(createdMetric, metric.getAvailableColumns());
        })
        .then(() => {
            result.notify({
                msg: `metric's availableColumns were cloned: ${newMetric.id}`
            });
            result.resolve(newMetric);
            this.toaster.success('Metric cloning finished successfully.');
        })
        .catch(() => {
            this.toaster.error('Something goes wrong during clone-execution.');
        });

        return result.promise;
    }
}

truedashApp.service('CloneManagerService', CloneManagerService);
