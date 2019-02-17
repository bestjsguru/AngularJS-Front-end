'use strict';

class DexiTableService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    process(params) {
        return this.DataProvider.post('card/processCardCustomizedData', params, false).then(response => {
            return response;
        });
    }
}

truedashApp.service('DexiTableService', DexiTableService);
