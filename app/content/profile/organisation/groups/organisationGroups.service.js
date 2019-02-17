'use strict';

import OrganisationGroup from './organisationGroup.model';

class OrganisationGroupsService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    create(data) {
        return new OrganisationGroup(data);
    }
    
    getAll() {
        return this.DataProvider.get('group/list', {}, false).then(groups => {
            return groups.map(group => this.create(group));
        });
    }
    
    save(group) {
        return this.DataProvider.post('group/save', group.getJson(), false).then(response => this.create(response));
    }
    
    update(group) {
        return this.DataProvider.post('group/save', group.getJson(), false).then(response => this.create(response));
    }
    
    remove(group) {
        return this.DataProvider.get('group/delete/' + group.id, {}, false);
    }
}

truedashApp.service('OrganisationGroupsService', OrganisationGroupsService);
