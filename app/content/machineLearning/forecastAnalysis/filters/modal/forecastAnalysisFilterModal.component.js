'use strict';

import '../forecastAnalysisFilters.component';
import ConvertFilter from '../../../../builder/filters/convertFilter';
import {FilterModel} from '../../../../card/model/filter.model';

class ForecastAnalysisFilterModalController {
    constructor($scope, MetricDataService, DeregisterService, ForecastAnalysisService) {
        this.MetricDataService = MetricDataService;
        this.ForecastAnalysisService = ForecastAnalysisService;
        
        this.watchers = DeregisterService.create($scope);
        
        this.tableFilters = [];
        this.tables = {
            loading: false,
            items: [],
        };
        
        this.filters = {
            loading: false,
            items: [],
        };
    }

    $onInit() {
        this.actualMetric = this.resolve.forecastAnalysis.actualMetric;
        this.forecastMetric = this.resolve.forecastAnalysis.forecastMetric;
        
        this.loadTables();
        this.loadFilters(this.resolve.forecastAnalysis.filters);
    
        this.watchers.onRoot('forecastAnalysis.filters.changed', (event, filters) => {
            this.loadFilters(filters);
        });
    }
    
    convertFilter(filter) {
        return (new ConvertFilter()).toText(new FilterModel(filter));
    }
    
    loadTables() {
        this.tables.loading = true;
        
        this.ForecastAnalysisService.getAvailableDimensions(this.actualMetric.id, this.forecastMetric.id).then(columns => {
            this.columns = columns;
    
            return this.MetricDataService.loadOrganisationTables().then(tables => {
                this.tables.items = tables.reduce((items, table) => {
                    let availableColumnIds = this.columns.filter(column => column.tableId === table.id).map(column => column.columnId);
                    
                    if(availableColumnIds.length) {
                        table.columns = table.columns.filter(column => availableColumnIds.includes(column.id));
                        
                        items.push(table);
                    }
                    
                    return items;
                }, []);
            }).finally(() => {
                this.tables.loading = false;
            });
        });
    }
    
    loadFilters(filters) {
        this.filters.items = filters;
        
        // Get unique table id's from users filters and sort them ascending
        this.filterTables = this.filters.items.reduce((tables, filter) => {
            !tables.includes(filter.column.tableId) && tables.push(parseInt(filter.column.tableId));
        
            return tables;
        }, []).sort((a, b) => a - b);
    }
    
    selectTable(tableId) {
        this.tables.selected = this.tables.items.find(table => table.id === tableId);
        this.onTableSelect();
    }
    
    getTableFilters(tableId) {
        return this.filters.items.filter(filter => filter.column.tableId === tableId);
    }
    
    tableName(tableId) {
        let table = this.tables.items.find(table => {
            return table.id === tableId;
        });
        
        return table && table.name;
    }
    
    onTableSelect() {
        this.tableFilters = this.tables.selected ? this.getTableFilters(this.tables.selected.id) : [];
    }
    
    selectTablePlaceholder() {
        if(this.tables.loading) return 'Loading tables...';
        
        return this.tables.items.length ? 'Select table' : 'There are no tables';
    }
}

truedashApp.component('appForecastAnalysisFilterModal', {
    controller: ForecastAnalysisFilterModalController,
    templateUrl: 'content/machineLearning/forecastAnalysis/filters/modal/forecastAnalysisFilterModal.html',
    bindings: {
        modalInstance: "<",
        resolve: '<',
    }
});
