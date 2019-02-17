'use strict';

class IntegrationService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    getAll() {
        return this.DataProvider.get('integration/getAll', {}, false).then(response => {
            return response;
        });
    }
}

truedashApp.service('IntegrationService', IntegrationService);
