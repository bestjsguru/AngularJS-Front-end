'use strict';

import {MetricModel} from './metric.model.js';
import {MetricCollection} from './metric.collection.js';

class MetricService {
    constructor(DataProvider, DateRangeService, Auth, UserService, AppEventsService, MetricCacheHelperService) {
        this.Auth = Auth;
        this.UserService = UserService;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.DateRangeService = DateRangeService;
        this.MetricCacheHelperService = MetricCacheHelperService;
    }

    createCollection() {
        return new MetricCollection(this.DataProvider, this.DateRangeService);
    }

    /**
     * @param {MetricDataModel} metricData
     * @param {MetricModel} metric
     * @returns {*|Promise.<T>}
     */
    update(metricData, metric) {
        return this.DataProvider.post('metric/update', metricData).then(response => {
            metric.info = response;
            for (var key in metricData) {
                metric[key] = metricData[key];
            }

            this.AppEventsService.track('updated-metric', {id: metric.id});

            return response;
        });
    }

    /**
     * @param {MetricDataModel} metricData
     * @returns {*|Promise.<T>}
     */
    create(metricData) {
        metricData.active = true;
        metricData.label = metricData.name;
        metricData.owner = this.Auth.user.id;

        return this.DataProvider.post('metric/create', metricData).then(response => {

            this.AppEventsService.track('created-metric', {id: response.id});

            return response;
        });
    }
    
    cloneMetric(metricData, filters, originalMetric) {
        metricData.active = true;
        metricData.label = metricData.name;
        metricData.owner = this.Auth.user.id;

        let params = {
            metric: metricData,
            filters: filters
        };
        return this.DataProvider.post('metric/cloneMetric', params).then(response => {

            this.MetricCacheHelperService.addMetric(response);

            this.AppEventsService.track('cloned-metric', {source_id: originalMetric.getId(), cloned_id: response.id});

            return response;
        });
    }
    
    clone(id) {
        return this.DataProvider.post('metric/clone/' + id).then(response => {
            
            this.MetricCacheHelperService.addMetric(response);
            
            this.AppEventsService.track('cloned-metric', {source_id: id, cloned_id: response.id});
            
            return response;
        });
    }

    delete(metric) {
        return this.DataProvider.get('metric/delete', {id: metric.id}, false).then(response => {

            this.MetricCacheHelperService.removeMetric(metric);

            this.AppEventsService.track('deleted-metric', {id: metric.id});

            return response;
        });
    }

    toggle(metric) {
        let action = metric.active ? 'deactivate' : 'activate';
        
        return this.DataProvider.get('metric/' + action + '/' + metric.id, {}, false).then(response => {
    
            metric.info = response;
            metric.active = !metric.active;
            response.table = _.isObject(response.table) ? response.table.id : response.table;
            
            this.MetricCacheHelperService.updateMetric(response);

            return response;
        });
    }

    getAllCohorts(useCache) {
        return this.DataProvider.get(`metric/cohorts`, {}, useCache).then(metrics => {
            return metrics.map((metric) => MetricCollection.create(metric, undefined, this.DateRangeService, this.Auth, this.UserService));
        });
    }

    getAll(card, useCache) {
        let params = card ? {card: card.getJson()} : null;

        // We have to send card param through POST because it can get very big
        // but every other request should be GET so we can use caching
        let request = card ? 'post' : 'get';

        return this.DataProvider[request](`metric/all`, params, useCache).then(metrics => {
            return metrics.map((metric) => MetricCollection.create(metric, undefined, this.DateRangeService, this.Auth, this.UserService));
        });
    }
    
    getList(useCache = false) {
        return this.DataProvider.get('metric/list', {}, useCache).then(metrics => {
            return metrics.map((metric) => MetricCollection.create(metric, undefined, this.DateRangeService, this.Auth, this.UserService));
        });
    }
    
    getByDataSource(datasourceId, useCache) {
        return this.DataProvider.get(`metric/all`, {datasourceId}, useCache).then(metrics => {
            return metrics.map((metric) => MetricCollection.create(metric, undefined, this.DateRangeService, this.Auth, this.UserService));
        });
    }

    getIdFromJson(data) {
        return MetricModel.getIdFromJson(data);
    }
}

truedashApp.service('MetricService', MetricService);
