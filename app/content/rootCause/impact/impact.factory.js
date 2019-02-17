'use strict';

import {ImpactCollection} from './impact.collection';

class Impacts extends ImpactCollection {
    constructor(data, $injector) {
        super($injector);

        this.data = data;
        this.init(data.metrics_impact);
    }

    init(impacts) {
        this.clear();

        impacts.forEach(item => {
            item.drillDown = this.getImpactValues(item);
            this.add(item);
        });

        this.items.forEach((item) => item.setGoal(this.goal));
        
        this.sortImpacts();

        return this.items;
    }

    getImpactValues(item) {
        let values = {
            before: [],
            after: [],
            diff: [],
            dimensions: [],
            likeForLike: [],
        };

        this.data.root_cause.metrics.forEach(dataItem => {
            if(dataItem.metric_id === item.metric_id) {
                values[dataItem.type.toLowerCase()] = dataItem.vals;
            }
        });

        this.data.root_cause.dimensions.forEach(dataItem => {
            values.dimensions.push({
                name: dataItem.dimension_name,
                values: dataItem.vals
            });
        });
        
        this.data.root_cause.likeForLike.forEach(like => {
            values.likeForLike.push(!!like);
        });

        return values;
    }
}

truedashApp.service('ImpactFactory', ($injector) => ({
    create: (data) => {
        return new Impacts(data, $injector);
    }
}));
