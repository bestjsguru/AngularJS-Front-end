'use strict';

import {Config} from '../config';

class ColumnCacheHelperService {
    constructor(CacheService, DataProvider) {
        this.CacheService = CacheService;
        this.DataProvider = DataProvider;
        this.organisationTablesKey = "GET" + Config.baseUrl + "table/tablesByOrganisation";
    }
    
    dataSourceTablesKey(sourceId) {
        return "GET" + Config.baseUrl + "table/tablesByDataSource?id=" + sourceId;
    }
    
    addColumn(column, sourceId) {
        this.addToOrganisationTables(column);
        this.addToDataSourceTables(column, sourceId);
    }
    
    updateColumn(column, sourceId) {
        this.removeColumn(column, sourceId);
        this.addColumn(column, sourceId);
    }
    
    updateColumns(columns, sourceId) {
        columns.forEach(column => {
            this.removeColumn(column, sourceId);
            this.addColumn(column, sourceId);
        });
    }
    
    removeColumn(column, sourceId) {
        this.removeFromOrganisationTables(column);
        this.removeFromDataSourceTables(column, sourceId);
    }

    addToOrganisationTables(column) {
        let tables = this.CacheService.get(this.organisationTablesKey);
        if(!tables || !_.isObject(column)) return;
        
        let existingTable = tables.find(table => table.id === column.tableId);

        if(existingTable) {
            existingTable.columns.push(column);
    
            this.CacheService.put(this.organisationTablesKey, tables);
        }
    }
    
    addToDataSourceTables(column, sourceId) {
        if(!_.isObject(column) || !sourceId) return;
        
        let tables = this.CacheService.get(this.dataSourceTablesKey(sourceId));
        if(!tables) return;
    
        let existingTable = tables.find(item => item.id === column.tableId);
    
        if(existingTable) {
            existingTable.columns.push(column);
        
            this.CacheService.put(this.dataSourceTablesKey(sourceId), tables);
        }
    
        console.log(this.CacheService.get(this.dataSourceTablesKey(sourceId)));
    }
    
    removeFromOrganisationTables(column) {
        let tables = this.CacheService.get(this.organisationTablesKey);
        if(!tables || !_.isObject(column)) return;
    
        let existingTable = tables.find(table => table.id === column.tableId);
    
        if(existingTable) {
            existingTable.columns = existingTable.columns.filter(item => item.id !== column.id);
        
            this.CacheService.put(this.organisationTablesKey, tables);
        }
    }
    
    removeFromDataSourceTables(column, sourceId) {
        if(!_.isObject(column) || !sourceId) return;
    
        let tables = this.CacheService.get(this.dataSourceTablesKey(sourceId));
        if(!tables) return;
    
        let existingTable = tables.find(item => item.id === column.tableId);
    
        if(existingTable) {
            existingTable.columns = existingTable.columns.filter(item => item.id !== column.id);
    
            this.CacheService.put(this.dataSourceTablesKey(sourceId), tables);
        }
    }
    
    getOrganisationTable(id) {
        let tables = this.CacheService.get(this.organisationTablesKey);
        if(!tables || !id) return;
    
        return tables.find(table => table.id === id);
    }
}

truedashApp.service('ColumnCacheHelperService', ColumnCacheHelperService);
