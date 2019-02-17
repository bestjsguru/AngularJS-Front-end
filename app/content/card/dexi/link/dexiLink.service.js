'use strict';

class DexiLinkService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    create(link) {
        return this.DataProvider.post('card/hooks', link, false).then(response => {
            return response;
        });
    }
    
    delete(link) {
        return this.DataProvider.delete('card/hooks/' + link.id, {}, false).then(response => {
            return response;
        });
    }
}

truedashApp.service('DexiLinkService', DexiLinkService);
