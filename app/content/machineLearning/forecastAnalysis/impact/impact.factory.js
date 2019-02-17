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

        return this.items;
    }

    getImpactValues(item) {
        let values = {
            variance: this.data.forecast_analysis.variance,
            actual: this.data.forecast_analysis.actual,
            forecast: this.data.forecast_analysis.forecast,
            dimensions: [],
        };

        this.data.forecast_analysis.dimensions.forEach(dataItem => {
            values.dimensions.push({
                name: dataItem.dimension_name,
                values: dataItem.values
            });
        });

        return values;
    }
}

truedashApp.service('ForecastAnalysisImpactFactory', ($injector) => ({
    create: (data) => {
        return new Impacts(data, $injector);
    }
}));
