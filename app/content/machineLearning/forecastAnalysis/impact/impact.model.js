'use strict';

import {EventEmitter} from '../../../system/events';

export class ImpactModel extends EventEmitter {
    constructor(data) {
        super();

        data = data || {};

        this.id = data.metric_id;
        this.symbol = this.getDataSymbol(data.symbol);
        this.isIncrease = !! data.isIncrease;
        this.drillDown = data.drillDown;

        this.metric = {
            id: data.metric_id,
            name: data.metric_name,
        };
    
        this.actual = data.metric_type === 'actual';
        this.forecast = data.metric_type === 'forecast';
    }
    
    getDataSymbol(symbol) {
        if(symbol === '\\u00a3') return '£';
        if(symbol === '\\u0024') return '$';
        
        return symbol;
    }
}
