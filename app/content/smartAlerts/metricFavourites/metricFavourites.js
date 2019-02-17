'use strict';

import {Collection} from '../../data/collection';

export class MetricFavourites extends Collection {
    constructor(favourites, $injector) {
        super();
        this.$injector = $injector;
        this.Auth = this.$injector.get('Auth');
        this.UserService = this.$injector.get('UserService');
        
        favourites = favourites || [];
        
        favourites.forEach(item => this.add(item));
    }
    
    add(data) {
        data.user = this.UserService.create(data.user);
        this.items.push(data);
        this.trigger('added', data);
        return data;
    }
    
    removeItem(favorite) {
        let index = this.items.findIndex((item) => item.id === favorite.id);
    
        if(index >= 0) {
            this.removeByIdx(index);
            this.trigger('removed', favorite);
        }
    }
    
    hasCurrentUser() {
        return this.items.find(item => item.user.id === this.Auth.user.id);
    }

    clear() {
        super.clear();
        this.trigger('clear');
    }
}

truedashApp.service('MetricFavouritesFactory', ($injector) => ({
    create: (favourites) => new MetricFavourites(favourites, $injector)
}));
