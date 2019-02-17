'use strict';

class DatabaseExplorerService {
    constructor(DataProvider, $q) {
        this.$q = $q;
        this.DataProvider = DataProvider;
    }

    getTablePreview(table, useCache = true) {
        let params = { tableId: table.id};

        return this.DataProvider.get('table/preview', params, useCache);
    }

    executeSql(sql, schema) {
        let params = {statement: sql, schema: schema};

        return this.DataProvider.post('explorer/executeSql', params);
    }
}

truedashApp.service('DatabaseExplorerService', DatabaseExplorerService);
