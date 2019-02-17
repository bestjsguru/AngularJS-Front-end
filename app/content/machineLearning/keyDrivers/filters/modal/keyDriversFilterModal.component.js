'use strict';

import '../keyDriversFilters.component';
import ConvertFilter from '../../../../builder/filters/convertFilter';
import {FilterModel} from '../../../../card/model/filter.model';

class KeyDriversFilterModalController {
    constructor($scope, MetricDataService, DeregisterService, KeyDriversService) {
        this.MetricDataService = MetricDataService;
        this.KeyDriversService = KeyDriversService;
        
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
        this.actualMetric = this.resolve.keyDrivers.actualMetric;
        
        this.loadTables();
        this.loadFilters(this.resolve.keyDrivers.filters);
    
        this.watchers.onRoot('keyDrivers.filters.changed', (event, filters) => {
            this.loadFilters(filters);
        });
    }
    
    convertFilter(filter) {
        return (new ConvertFilter()).toText(new FilterModel(filter));
    }
    
    loadTables() {
        this.tables.loading = true;
        
        this.KeyDriversService.getAvailableDimensions(this.actualMetric.id).then(columns => {
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

truedashApp.component('appKeyDriversFilterModal', {
    controller: KeyDriversFilterModalController,
    templateUrl: 'content/machineLearning/keyDrivers/filters/modal/keyDriversFilterModal.html',
    bindings: {
        modalInstance: "<",
        resolve: '<',
    }
});
