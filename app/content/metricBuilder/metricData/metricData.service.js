'use strict';

import {TableModel} from './table.model.js';
import {MetricModel} from '../../card/model/metric.model.js';
import {ColumnEntityModel} from '../../card/model/columnEntity.model.js';
import {ColumnHelper} from '../../card/datatable/column.helper.js';

class MetricDataService {

    /**
     * @param {DataProvider} DataProvider
     * @param {ColumnEntityModel} ColumnEntityModel
     * @param {FilterModel} FilterModel
     * @param {MetricService} MetricService
     * @param {UserService} UserService
     */
    constructor(DataProvider, ColumnEntityModel, FilterModel, MetricService, UserService, $q) {
        this.$q = $q;
        this.UserService = UserService;
        this.FilterModel = FilterModel;
        this.DataProvider = DataProvider;
        this.MetricService = MetricService;
        this.ColumnEntityModel = ColumnEntityModel;

        this.useCache = true;
    }

    // Data Sources
    loadOrganisationSources(organisationId) {
        return this.DataProvider.get('truedashDataSource/list', { id: organisationId }, this.useCache);
    }

    loadOrganisationTables(useCache = this.useCache) {
        return this.DataProvider.get('table/tablesByOrganisation', { }, useCache).then(tables => {
            tables = tables.map(table => new TableModel(table));
            tables.sort((a, b) => a.label.localeCompare(b.label));
    
            return tables;
        });
    }

    loadTablesBySource(sourceId, useCache = this.useCache){
        return this.DataProvider.get('table/tablesByDataSource', {id: +sourceId}, useCache).then(tables => {
            tables = tables.map(table => new TableModel(table));
            tables.sort((a, b) => a.name.localeCompare(b.name));
            
            return tables;
        });
    }
    
    createTable(params) {
        return this.DataProvider.post('table/create', params);
    }
    
    editTable(params) {
        return this.DataProvider.post('table/update', params);
    }

    invalidateAllTables() {
        return this.DataProvider.clearCache('table/all', {}, 'GET');
    }

    invalidateOrganisationTables() {
        return this.DataProvider.clearCache('table/tablesByOrganisation', {}, 'GET');
    }

    invalidateAffectedCard(metricId) {
        this.DataProvider.get('metric/usage/' + metricId).then((response) => {
            response.forEach((card) => {
                this.DataProvider.clearCache('card/existingCard/' + card.id, {}, 'GET');
                //this.DataProvider.clearCache('card/info/' + card.id, {}, 'GET');
            });
        });
    }

    updateTablePosition(tableId, position) {
        return this.DataProvider.post('table/updatePosition', {id: tableId, position})
            .then(() => this.invalidateOrganisationTables());
    }

    // Columns
    loadTableColumns(tableId) {
        // This will only load desired table columns without relations
        return this.DataProvider.get('table/columnsByTableRelation', { tableId: tableId, level: 0 }, this.useCache);
    }
    
    setColumnDisplayName(column) {
        return this.DataProvider.post('table/setColumnDisplayName', {id: column.id, displayName: column.displayName});
    }

    loadAllTableColumns(tableId, metricId) {
        // This will load all table columns including columns from related tables
        return this.$q.all([this.DataProvider.get('table/columnsByTableRelation', {
            tableId, level: 3}, this.useCache), this.loadOrganisationTables(true)])
            .then(results => {
                let columns = results[0], tables = results[1];
                let resColumns = columns.map(column => new ColumnEntityModel(column));
                ColumnHelper.assignTablesToColumns(resColumns, tables);
                return resColumns;
            });
    }

    // Available Columns
    saveAvailableColumns(params) {
        return this.DataProvider.post('metric/addCustomColumnsList', params);
    }

    clearAvailableColumnsCache(metricId){
        this.DataProvider.clearCache('card/availableColumns/' + metricId, {}, 'GET');
    }

    loadAvailableColumns(metricId, useCache = true) {
        if(!metricId){
            return this.$q.reject('metric id hasn\'t been specified');
        }

        let req = this.$q.all([this.DataProvider.get('card/availableColumns/' + metricId, {}, useCache), this.loadOrganisationTables(true)]);

        return req.then(results => {
            let columns = results[0], tables = results[1];
            let metricFilters = [];
            columns.forEach(value => metricFilters.push(new this.ColumnEntityModel(value)));
            ColumnHelper.assignTablesToColumns(metricFilters, tables);
            return metricFilters;
        });
    }

    getFilters(metricId) {
        return this.DataProvider.get('metric/getAllFilters/' + metricId, {}, true).then(response => {
            var metricFilters = [];
            response.forEach(value => metricFilters.push(new this.FilterModel(value)));
            return metricFilters;
        });
    }

    invalidateFilters(metricId) {
        return this.DataProvider.clearCache('metric/getAllFilters/' + metricId, {}, 'GET');
    }

    addFilter(filter) {
        return this.DataProvider.post('metric/addMetricFilter', filter)
            .then(filter => new this.FilterModel(filter));
    }

    updateFilter(filter) {
        return this.DataProvider.post('metric/updateMetricFilter', filter);
    }

    deleteFilter(filterId) {
        return this.DataProvider.get('metric/removeMetricFilter/' + filterId, {}, false);
    }

    setFilterRules(rule, metricId) {
        return this.DataProvider.post('metric/setMetricRule', {rule, metricId});
    }

    getFilterRules(metricId) {
        return this.DataProvider.get('metric/getMetricRule/' + metricId);
    }

    invalidateFilterRule(metricId) {
        return this.DataProvider.clearCache('metric/getMetricRule/' + metricId, {}, 'GET');
    }
    
    toggleColumnsAvailableStatus(isAvailable, columns, table) {
        let params = {
            ids: columns.map(column => column.id),
            tableId: table.id,
            isDimension: isAvailable,
        };
        
        return this.DataProvider.post('table/bulkUpdateColumns', params, true).then(response => {
            return response;
        });
    }

    /**
     * @param {MetricModel} metric
     * @param {MetricDataModel} data
     */
    save(metric, data) {
        var metricDataUpdated = data.prepareToSave();

        let promise = metric.id
            ? this._updateStrategy(metricDataUpdated, metric)
            : this._createStrategy(metricDataUpdated);

        return promise.then((response) => {
            return new MetricModel(response, null, {}, {}, this.UserService);
        });
    }

    clone(metric, data, filters){
        var metricDataUpdated = data.prepareToSave();
        metricDataUpdated.setOrganisation(window.Auth.user.organisation);

        metricDataUpdated.rule = metric.filtersRule;

        let promise = this.MetricService.cloneMetric(metricDataUpdated, filters, metric);

        return promise.then((response) => {
            return new MetricModel(response, null, {}, {}, this.UserService);
        });
    }

    /**
     * @param {MetricDataModel} metricData
     * @param {MetricModel} metric
     */
    _updateStrategy(metricData, metric) {
        return this.MetricService.update(metricData, metric);
    }

    /**
     * @param {MetricDataModel} metricData
     */
    _createStrategy(metricData) {
        metricData.setOrganisation(window.Auth.user.organisation);

        return this.MetricService.create(metricData);
    }
}

truedashApp.service('MetricDataService', MetricDataService);
