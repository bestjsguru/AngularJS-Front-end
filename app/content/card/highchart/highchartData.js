'use strict';

import GroupingTransformer from './groupingTransformer';
import {Config} from '../../config';

export default class HighchartData {
    constructor(card) {
        this.card = card;
        this.$filter = window.$injector.get('$filter');
    }

    get metrics() {
        if(this.card.groupings.length) {
            return (new GroupingTransformer(this.card)).getMetrics();
        }

        return this.card.metrics.getVisibleMetrics();
    }

    get groupingSets() {
        if(this.card.groupings.length) {
            return (new GroupingTransformer(this.card)).getGroupingSets();
        }

        return [];
    }
    
    get groupingCategories() {
        return (new GroupingTransformer(this.card)).getGroupingCategories();
    }
    
    wrapWithFormattingInfo(data, metric) {
        data.tooltip = data.tooltip || {};
        data.custom = {
            value: _.get(data, 'custom.value'),
            groupings: _.get(data, 'custom.groupings', []),
            formatting: data.formatting || {},
            metric: {
                id: this.card.metrics.getMetricId(metric),
                name: metric.label,
                type: this.card.metrics.getMetricType(metric),
                numberOfDecimals: metric.numberOfDecimals,
            },
        };
        
        let info = metric.getFormattingInfo();
    
        if(info.type) {
            data.custom.formatting.info = {
                type: info.type,
                symbol: info.symbol,
            };
            
            if(!['123', 'time'].includes(info.symbol || info.type)) {
                if(Config.chartOptions.symbols.suffixed.includes(info.symbol)) {
                    data.custom.formatting.prefix = false;
                    data.tooltip.valueSuffix = info.symbol;
                } else {
                    data.custom.formatting.prefix = true;
                    data.tooltip.valuePrefix = info.symbol;
                }
            }
        }
        
        return data;
    }
    
    setError(error) {
        this.chartOptions.error = error;
    }
}
