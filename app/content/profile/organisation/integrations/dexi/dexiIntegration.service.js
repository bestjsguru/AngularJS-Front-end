'use strict';

class DexiIntegrationService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    create(params) {
        return this.DataProvider.post('integration/create', params, false).then(response => {
            return params;
        });
    }
    
    delete(params) {
        return this.DataProvider.delete('integration/delete/' + params.id, {}, false).then(response => {
            return response;
        });
    }
}

truedashApp.service('DexiIntegrationService', DexiIntegrationService);
