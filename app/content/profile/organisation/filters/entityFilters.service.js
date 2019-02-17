'use strict';

import {User} from '../../user.model';

class EntityFiltersService {
    constructor(DataProvider, $q) {
        this.$q = $q;
        this.DataProvider = DataProvider;
    }
    
    getAll(entity) {
        let params = {
            entityId: entity.id,
            type: entity instanceof User ? 'user' : 'group',
        };
        
        return this.DataProvider.get('userFilter/list', params, false).then(response => {
            return response.map(entityFilter => entityFilter.filter);
        });
    }
    
    create(filter, entity) {
        let params = {
            filter,
            entityId: entity.id,
            filterType: entity instanceof User ? 'user' : 'group',
        };
    
        return this.DataProvider.post('userFilter/save', params, false);
    }
    
    update(filter, entity) {
        let params = {
            filter,
            entityId: entity.id,
            filterType: entity instanceof User ? 'user' : 'group',
        };
    
        return this.DataProvider.post('userFilter/save', params, false);
    }
    
    remove(filter) {
        return this.DataProvider.get('userFilter/delete/' + filter.id, {}, false);
    }
}

truedashApp.service('EntityFiltersService', EntityFiltersService);
