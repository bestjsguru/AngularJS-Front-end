'use strict';

import {MetricDataHelper} from '../../../metricBuilder/metricData/metricData.helper.js';
import {MetricDataModel} from '../../../metricBuilder/metricData/metricData.model';
import {MetricModel} from '../../../card/model/metric.model';

class MetricDataCtrl {
    constructor($rootScope, toaster, MetricService, MetricDataService, $q, UserService) {
        this.$rootScope = $rootScope;
        this.$q = $q;
        this.toaster = toaster;
        this.MetricService = MetricService;
        /** @type {MetricDataService} **/
        this.MetricDataService = MetricDataService;
        this.UserService = UserService;
        
        this.submitted = false;
        this.loading = false;
    }
    
    $onInit() {
        this.item = this.resolve.item;
        this.table = this.resolve.table;
        this.tables = this.resolve.tables;
        this.source = this.resolve.source;
        this.metric = this.item ? this.item.value : new MetricModel({}, null, undefined, undefined, this.UserService);
        
        this.resetVariables();
        this.initData();
        
        if(this.metric && this.metric.isSQLBased()){
            return this.$q.resolve('no reason to load source-related data');
        }
        
        if(!this.data.isSqlBased()){
            this.initMetricColumns().then(() => {
                return this.preselectColumn();
            });
        }
    }
    
    isEditMode(){
        return !!(this.metric && this.metric.id);
    }
    
    isAddMode(){
        return !this.isEditMode();
    }
    
    resetVariables() {
        this.data = new MetricDataModel();
        this.xAxis = MetricDataHelper.defaultXAxis();
        this.yAxis = MetricDataHelper.defaultYAxis();
        this.complexities = MetricDataHelper.defaultComplexities();
        this.isIncrease = MetricDataHelper.defaultIsIncrease();
    
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
        
        this.dateColumns = {loading: false, items: []};
        this.metricTables = {loading: false, items: this.tables};
        this.availableColumns = {loading: false, items: []};
    }
    
    initData() {
        this.data.source = this.source;
        this.data.table = this.table;
        
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
    
    initMetricColumns() {
        
        if(!this.data.table) return this.$q.when(true);
        
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
                this.dateColumns.items = this.availableColumns.items.filter(column => column.isDate);
            });
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
            this.data.numberOfDecimals = this.decimals.find(item => item.value === this.metric.numberOfDecimals);
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
    
    save() {
        this.submitted = true;
        let isExisted = this.metric.id;
        // double click to update button fix
        if (angular.isUndefined(this.form)) this.form = {};
        // Don't submit if form is invalid
        if(this.form && !this.form.$invalid) {
            this.data.transformToServer(this.availableColumns.items);
            this.loading = true;
    
            return this.MetricDataService.save(this.metric, this.data).then((metric) => {
                this.submitted = false;
                
                if(isExisted){
                    this.$rootScope.$broadcast('insight.metricUpdated', metric);
                    this.toaster.success('Metric successfully updated');
                } else {
                    this.$rootScope.$broadcast('insight.metricCreated', metric);
                    this.toaster.success('Metric successfully created');
                }
                
                this.dismiss();
                
            }).catch((error) => {
                if(this.data.yAxis){
                    this.data.yAxis.type = {
                        name: this.data.yAxis.label,
                        value: this.data.yAxis.type,
                        default: this.data.yAxis.symbol
                    };
                }
                
                this.toaster.error('SQL Validation Error. ' + error.message);
                
                if(this.form && this.form.sqlQuery){
                    this.form.sqlQuery.$error = {sql: true};
                }
                
                return error;
            }).finally(() => {
                this.loading = false;
            });
        }
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
    
    isSymbolVisible() {
        return !['123', 'time'].includes(_.get(this.data.yAxis, 'symbol'));
    }
}

truedashApp.component('appMetricData', {
    controller: MetricDataCtrl,
    templateUrl: 'content/dataset/insight/metricData/metricData.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
