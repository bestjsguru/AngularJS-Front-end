'use strict';

class ColumnValueDropdownService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
        
        this.limit = 100;
    }
    
    loadValues(column, searchTerm = false, offset = 0) {

        let params = {
            columnId: column.id,
            limit: this.limit,
            offset: offset
        };

        if (searchTerm) {
            params.like = searchTerm;
        }

        return this.DataProvider.get('metric/getColumnValues', params).then(({output}) => {
            return output.map(value => String(value[0]));
        }).catch((error) => {
            console.warn(`Error loading values for column [${column.id}]. ${error}`);
        });
    }
}

truedashApp.service('ColumnValueDropdownService', ColumnValueDropdownService);
