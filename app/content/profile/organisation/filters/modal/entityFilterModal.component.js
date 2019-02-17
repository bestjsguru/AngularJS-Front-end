'use strict';

import '../entityFilters.service';
import '../entityFilters.component';
import ConvertFilter from '../../../../builder/filters/convertFilter';
import {FilterModel} from '../../../../card/model/filter.model';

class EntityFilterModalController {
    constructor($scope, MetricDataService, EntityFiltersService, DeregisterService) {
        this.EntityFiltersService = EntityFiltersService;
        this.MetricDataService = MetricDataService;
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
        this.entity = this.resolve.user || this.resolve.group;
        
        this.loadTables();
        this.loadFilters();
    
        this.watchers.onRoot('entity.filter.created entity.filter.updated entity.filter.deleted', (event, filter) => {
            this.loadFilters(false);
        });
    }
    
    convertFilter(filter) {
        return (new ConvertFilter()).toText(new FilterModel(filter));
    }
    
    loadTables() {
        this.tables.loading = true;
        
        this.MetricDataService.loadOrganisationTables().then(tables => {
            this.tables.items = tables;
        }).finally(() => {
            this.tables.loading = false;
        });
    }
    
    loadFilters(showLoader = true) {
        this.filters.loading = showLoader;
        
        return this.EntityFiltersService.getAll(this.entity).then(filters => {
            this.filters.items = filters;
            
            // Get unique table id's from users filters and sort them ascending
            this.filterTables = this.filters.items.reduce((tables, filter) => {
                !tables.includes(filter.column.tableId) && tables.push(parseInt(filter.column.tableId));
                
                return tables;
            }, []).sort((a, b) => a - b);
        }).finally(() => {
            this.filters.loading = false;
        });
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

truedashApp.component('appEntityFilterModal', {
    controller: EntityFilterModalController,
    templateUrl: 'content/profile/organisation/filters/modal/entityFilterModal.html',
    bindings: {
        modalInstance: "<",
        resolve: '<',
    }
});
