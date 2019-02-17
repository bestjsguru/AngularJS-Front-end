'use strict';

import {Config} from '../config';

class TableCacheHelperService {
    constructor(CacheService) {
        this.CacheService = CacheService;
        this.organisationTablesKey = "GET" + Config.baseUrl + "table/tablesByOrganisation";
    }
    
    dataSourceTablesKey(table) {
        return "GET" + Config.baseUrl + "table/tablesByDataSource?id=" + table.dataSource.id;
    }
    
    addTable(table) {
        this.addToOrganisationTables(table);
        this.addToDataSourceTables(table);
    }
    
    updateTable(table) {
        this.removeTable(table);
        this.addTable(table);
    }
    
    removeTable(table) {
        this.removeFromOrganisationTables(table);
        this.removeFromDataSourceTables(table);
    }

    addToOrganisationTables(table) {
        let tables = this.CacheService.get(this.organisationTablesKey);
        if(!tables || !_.isObject(table)) return;
        
        tables.push(table);

        this.CacheService.put(this.organisationTablesKey, tables);
    }
    
    addToDataSourceTables(table) {
        if(!_.isObject(table) || !table.dataSource) return;
        
        let tables = this.CacheService.get(this.dataSourceTablesKey(table));
        if(!tables) return;
        
        tables.push(table);
        
        this.CacheService.put(this.dataSourceTablesKey(table), tables);
    }
    
    removeFromOrganisationTables(table) {
        let tables = this.CacheService.get(this.organisationTablesKey);
        if(!tables || !_.isObject(table)) return;
        
        tables = tables.filter(item => item.id !== table.id);

        this.CacheService.put(this.organisationTablesKey, tables);
    }
    
    removeFromDataSourceTables(table) {
        if(!_.isObject(table) || !table.dataSource) return;
    
        let tables = this.CacheService.get(this.dataSourceTablesKey(table));
        if(!tables) return;
        
        tables = tables.filter(item => item.id !== table.id);

        this.CacheService.put(this.dataSourceTablesKey(table), tables);
    }
}

truedashApp.service('TableCacheHelperService', TableCacheHelperService);
