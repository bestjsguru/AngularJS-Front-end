'use strict';

import {MetricModel} from '../../card/model/metric.model.js';
import {MetricDataHelper} from './metricData.helper.js';
import {ColumnHelper} from '../../card/datatable/column.helper';
import {MetricDataModel} from './metricData.model';

class MetricDataCtrl {
    constructor($scope, $state, toaster, MetricService, MetricDataService, DeregisterService, UserService, $q) {
        this.$scope = $scope;
        this.$state = $state;
        this.$q = $q;
        this.toaster = toaster;
        this.MetricService = MetricService;
        /** @type {MetricDataService} **/
        this.MetricDataService = MetricDataService;
        this.UserService = UserService;

        this.submitted = false;
        this.loading = false;
    
        this.watchers = DeregisterService.create($scope);
        this.watchers.watch('md.metricBuilder.metricList.selectedMetric', this.onSelectedMetricChanged.bind(this));

        this.init();
        this._addSourceToTableBinders();

        this.watchers.watchCollection('md.data.complexity', this.onChangeComplexity.bind(this));
    }

    onSelectedMetricChanged(selectedMetric) {
        this.loading = true;

        if(_.isUndefined(selectedMetric.id)) {
            this.metric = new MetricModel({}, null, undefined, undefined, this.UserService);
        } else {
            this.metric = this.metricBuilder.metricList.selectedMetric;
        }

        this.init().then(() => {
            if (this.metric.id)
                this.data.complexity = this.complexities.find(item => item.value == this.metric.info.complexity);
            this.loading = false;
        });
    }

    cloneMetric() {
        this.loading = true;

        this.data.transformToServer(this.availableColumns.items);
        this.$scope.$emit('metric.clone', _.clone(this.metric), this.data);
    }

    init() {
        this.resetVariables();
        this.initData();

        if(this.metric && this.metric.isSQLBased()){
            return this.$q.resolve('no reason to load source-related data');
        }

        let promise = this.initMetricSources();

        if(this._isEditMode() && !this.data.isSqlBased()){
            promise.then(() => {
                return this.initMetricTables();
            }).then(() => {
                this.preselectSource();
                return this.initMetricColumns();
            }).then(() => {
                this.preselectColumn();
            });
        }

        return promise;
    }

    _addSourceToTableBinders(){
        this.$scope.$watch(
            () => this.data.source,
            () => {
                this.initMetricTablesOverSource()
                    .catch(error => console.error(error))
                    .then(() => {
                        return this.initMetricColumns();
                    })
                    .then(() => {
                        this.preselectColumn();
                    });
            }
        );
    }

    _isEditMode(){
        return !!(this.metric && this.metric.id);
    }

    _isAddMode(){
        return !this._isEditMode();
    }

    resetVariables() {
        this.data = new MetricDataModel();
        this.complexities = MetricDataHelper.defaultComplexities();
        this.isIncrease = MetricDataHelper.defaultIsIncrease();
        this.xAxis = MetricDataHelper.defaultXAxis();
        this.yAxis = MetricDataHelper.defaultYAxis();
    
        this.decimals = [
            { value: null, label: 'Default'},
            { value: 0, label: 'No decimal places'},
            { value: 1, label: '1 decimal place'},
            { value: 2, label: '2 decimal places'},
            { value: 3, label: '3 decimal places'},
            { value: 4, label: '4 decimal places'},
            { value: 5, label: '5 decimal places'},
            { value: 6, label: '6 decimal places'},
        ];
        
        this.metricTables = {loading: false, items: []};
        this.metricSources = {loading: false, items: []};
        this.dateColumns = {loading: false, items: []};
        this.availableColumns = {loading: false, items: []};
    }

    initData() {
        
        if(this.metric) {
            angular.extend(this.data, {
                name: _.clone(this.metric.name),
                label: _.clone(this.metric.name),
                description: _.clone(this.metric.description),
                statement: _.clone(this.metric.statement),
                id: _.clone(this.metric.id),
                xAxis: !this.metric.info.xAxis ? null : _.clone(this.metric.getXAxisInfo()),
                yAxis: !this.metric.info.yAxis ? null : _.clone(this.metric.getYAxisInfo()),
                isIncrease: _.clone(this.metric.isIncrease),
                numberOfDecimals: _.clone(this.metric.numberOfDecimals),
            });

            this.preselectAxisTypes();
            this.preselectComplexity();
            this.preselectDecimals();
            this.preselectIsIncrease();
        }
    }

    initMetricSources() {

        this.metricSources.loading = true;

        return this.MetricDataService.loadOrganisationSources(window.Auth.user.organisation.id).then(sources => {
            this.metricSources.loading = false;
            this.metricSources.items = _.sortBy(sources, 'name');
        });
    }

    initMetricTablesOverSource() {
        this.metricTables.loading = true;
        this.metricTables.items = [];

        if(!this.data.source){
            return this.$q.reject('Data source not defined');
        }

        return this.MetricDataService.loadTablesBySource(this.data.source.id).then((tables) => {
            this.metricTables.loading = false;
            this.metricTables.items = tables;
            this.preselectTable();
        });
    }

    initMetricTables(){
        this.metricTables.loading = true;
        this.metricTables.items = [];

        return this.MetricDataService.loadOrganisationTables().then((tables) => {
            this.metricTables.loading = false;
            this.metricTables.items = tables;
        });
    }

    initMetricColumns() {

        if(!this.data.table) return false;

        delete this.data.dateColumn;
        this.availableColumns.loading = true;
        this.availableColumns.items = [];
        this.dateColumns.loading = true;
        this.dateColumns.items = [];

        return this.MetricDataService
            .loadAllTableColumns(this.data.table.id, this.metric.getId())
            .then((columns) => {
                this.availableColumns.loading = false;
                this.dateColumns.loading = false;
                this.availableColumns.items = columns;
                this.dateColumns.items = this.availableColumns.items
                    .filter(column => column.isDate)
                    .sort(function(a, b) {
                        return a.getLabel().localeCompare(b.getLabel());
                    });
            });
    }

    /**
     * @deprecated
     * @returns {*}
     */
    isNormal() {
        return this.data.isNormal();
    }

    onTableChange() {
        if(this.data.table.id) {
            this.initMetricColumns(this.data.table.id);
        }
    }

    onYAxisTypeChange() {
        this.data.yAxis.symbol = this.data.yAxis.type.default;
    }

    preselectAxisTypes() {
        if(this.data.xAxis) {
            this.data.xAxis.type = this.xAxis.types.find(item => item.value === this.data.xAxis.type) || null;
        }
        
        if(this.data.yAxis) {
            this.data.yAxis.type = this.yAxis.types.find(item => item.value === this.data.yAxis.type) || null;
        }
    }

    preselectComplexity() {
        if(!this.metric.id) {
            this.data.complexity = this.complexities[0];
        } else {
            this.data.complexity = this.complexities.find(item => item.value == this.metric.info.complexity);
        }
    }
    
    preselectDecimals() {
        if(!this.metric.id) {
            this.data.numberOfDecimals = this.decimals[0];
        } else {
            this.data.numberOfDecimals = this.decimals.find(item => item.value == this.metric.numberOfDecimals);
        }
    }
    
    preselectIsIncrease() {
        if(!this.metric.id) {
            this.data.isIncrease = this.isIncrease[0];
        } else {
            this.data.isIncrease = this.isIncrease.find(item => item.value == this.metric.info.isIncrease);
        }
    }

    preselectColumn() {
        let columnId = this.metric.info ? this.metric.info.dateColumn : null;

        // Because dateColumn can either have columnID or columnName we have to try to search by both values
        // In order to preselect correct column. columnID is usualy sent for dynamicRelation complexity
        this.data.dateColumn = this.availableColumns.items.find(item => item.id == columnId);

        if(!this.data.dateColumn) {
            this.data.dateColumn = this.availableColumns.items.find(item => item.name == columnId);
        }
    }

    preselectTable() {
        let tableId = this.metric.table || null;
        this.data.table = this.metricTables.items.find(item => item.id === tableId);
    }

    preselectSource() {
        if(!this.data.isSqlBased()){
            this.data.source = this.metricSources.items.find(item => item.name == this.metric.getSource().name);
        }
    }

    save() {
        this.submitted = true;
        let isExisted = this.metric.id;
        // double click to update button fix
        if (angular.isUndefined(this.form)) this.form = {};
        // Don't submit if form is invalid
        if(this.form && !this.form.$invalid) {
            this.data.transformToServer(this.availableColumns.items);
            this.loading = true;

            return this.MetricDataService
                .save(this.metric, this.data)
                .then((metric) => {
                    this.submitted = false;

                    if(isExisted){
                        this.toaster.success('Metric successfully updated');
                    } else {
                        this.$scope.md.$scope.$broadcast('metricBuilder.metricCreated', metric);
                        this.toaster.success('Metric successfully created');
                    }

                    return this.metricBuilder.metricList.refreshMetricList().then(() => {
                        this.loading = false;
                        this.$state.go('.', {
                            metricId: metric.id
                        });
                    });
                }).catch((error) => {
                    this.loading = false;
                    this.toaster.error('SQL Validation Error. ' + error.message);

                    if(this.form && this.form.sqlQuery){
                        this.form.sqlQuery.$error = {sql: true};
                    }

                    return error;
                });
        }
    }

    metricSourcesPlaceholder() {
        if(this.metricSources.loading) return 'Loading...';
        if(!this.metricSources.items.length) return 'No sources';

        return 'Select source';
    }

    metricTablesPlaceholder() {
        if(this.metricTables.loading) return 'Loading...';
        if(!this.metricTables.items.length) return 'No tables';

        return 'Select table';
    }

    dateColumnsPlaceholder() {
        if(this.dateColumns.loading) return 'Loading...';
        if(!this.data.table) return 'Select table first';
        if(!this.dateColumns.items.length) return 'No columns';

        return 'Select column';
    }

    /**
     * Check if form field is dirty
     *
     * @param field
     * @returns boolean
     */
    dirty(field) {
        return (field && field.$dirty) || this.submitted;
    }

    getMappedMetricSourceByName(name){
        return this.metricSources.items.find((source) => source.name === name);
    }

    onChangeComplexity(){
        if(this.data.isSqlBased()) {
            this.metricTables.items = [];
            this.metricSources.items = [];
            this.data.source = undefined;
            this.data.table = undefined;
        } else {
            this.initMetricSources();
        }
    }
    
    isSymbolVisible() {
        return !['123', 'time'].includes(_.get(this.data.yAxis, 'symbol'));
    }
}

truedashApp.directive('tuMetricData', () => {
    return {
        controller: MetricDataCtrl,
        templateUrl: 'content/metricBuilder/metricData/metricData.html',
        scope: {
            metric: '=?'
        },
        restrict: 'E',
        bindToController: true,
        controllerAs: 'md',
        require: '^tuMetricBuilder',
        link: function(scope, element, attrs, metricBuilder) {
            scope.md.metricBuilder = metricBuilder;
            scope.md.metricBuilder.metricData = scope.md;
        }
    };
});
