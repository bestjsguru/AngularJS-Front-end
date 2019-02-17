"use strict";

import {DataSourceModel} from './dataSource.model';

class DataSourceService {

    constructor(DataProvider, $q) {
        this.DataProvider = DataProvider;
        this.$q = $q;
    }

    getList() {
        return this.DataProvider.get('truedashDataSource/list', {}, false).then(response => {
            return response.map(data => new DataSourceModel(data));
        });
    }
    
    getById(id) {
        return this.DataProvider.get('truedashDataSource/getById/' + id, {}, false).then(source => {
            return new DataSourceModel(source);
        });
    }
    
    getInfo(id, useCache = true) {
        return this.DataProvider.get('truedashDataSource/info/' + id, {}, useCache).then(source => {
            return new DataSourceModel(source);
        });
    }
}

truedashApp.service('DataSourceService', DataSourceService);
