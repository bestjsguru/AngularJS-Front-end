'use strict';

import {Config} from '../config';

class RelationshipCacheHelperService {
    constructor(CacheService) {
        this.CacheService = CacheService;
        this.relationshipAllKey = "GET" + Config.baseUrl + "relationship/all";
    }

    addOrUpdate(relationship) {
        let list = this.CacheService.getCache(this.relationshipAllKey, "cache");

        if (list) {
            let index = list.findIndex(item => item.id === relationship.id);

            if(index >= 0) {
                list[index] = relationship;
            } else {
                list.push(relationship);
            }

            this.CacheService.put(this.relationshipAllKey, list);
        }
    }

    remove(relationship) {
        let list = this.CacheService.getCache(this.relationshipAllKey, "cache");

        if (list) {
            list = list.filter(item => item.id !== relationship.id);

            this.CacheService.put(this.relationshipAllKey, list);
        }
    }
}

truedashApp.service('RelationshipCacheHelperService', RelationshipCacheHelperService);
