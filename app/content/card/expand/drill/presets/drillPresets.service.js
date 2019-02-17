'use strict';

class DrillPresetsService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    getAll(cardId, useCache = true) {
        return this.DataProvider.get('card/getPresets/' + cardId, {}, useCache);
    }
    
    save(preset) {
        let params = preset.getJson();
        
        if(params.id) {
            return this.DataProvider.post('card/savePreset/' + params.id, params, false);
        }
        
        return this.DataProvider.post('card/savePreset', params, false);
    }
    
    remove(preset) {
        return this.DataProvider.delete('card/deletePreset/' + preset.id, {}, false);
    }
}

truedashApp.service('DrillPresetsService', DrillPresetsService);
