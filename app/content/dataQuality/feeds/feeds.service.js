"use strict";

import {FeedsModel} from './feeds.model';
import {SubscriptionModel} from './subscription.model';

class FeedsService {

    constructor(DataProvider, $q) {
        this.DataProvider = DataProvider;
        this.$q = $q;
    }

    getList(useCache = true) {
        return this.DataProvider.get('system/getFeedInfo', {}, useCache).then(response => {
            return response.map(data => new FeedsModel(data));
        });
    }
    
    getSubscriptions(useCache = true) {
        return this.DataProvider.get('system/feedSubscriptions', {}, useCache).then(response => {
            return response.map(data => new SubscriptionModel(data));
        });
    }

    subscribe(subscriptions) {
        let items = _.isArray(subscriptions) ? _.cloneDeep(subscriptions) : [subscriptions];
        
        items = items.map(item => item.getJson());
        
        return this.DataProvider.post('system/feedSubscriptions', items).then(response => {
            return response.map(data => new SubscriptionModel(data));
        });
    }
}

truedashApp.service('FeedsService', FeedsService);
