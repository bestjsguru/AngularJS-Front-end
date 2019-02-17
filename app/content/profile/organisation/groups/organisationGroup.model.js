'use strict';

export default class OrganisationGroup {
    constructor(data) {
        data = data || {};
        
        this.init(data);
    }

    init(data) {
        this.id = data.id || null;
        this.name = data.name;
        this.description = data.description || '';
        this.filters = data.filters || [];
        this.users = data.users || [];
        this.inEditMode = false;
    }
    
    hasUser(user) {
        return this.users.includes(user.id);
    }
    
    addUser(user) {
        !this.hasUser(user) && this.users.push(user.id);
    }
    
    removeUser(user) {
        if(this.hasUser(user)) {
            this.users = this.users.filter(id => id !== user.id);
        }
    }
    
    toggleUser(user) {
        this.hasUser(user) ? this.removeUser(user) : this.addUser(user);
    }
    
    getJson() {
        let data = {
            name: this.name,
            description: this.description,
            users: this.users,
        };
        
        if(this.id) data.id = this.id;
        
        return data;
    }
}
