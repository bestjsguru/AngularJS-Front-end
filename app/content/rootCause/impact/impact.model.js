'use strict';

import {EventEmitter} from '../../system/events';

export class ImpactModel extends EventEmitter {
    constructor(data, $injector) {
        super();

        this.$filter = $injector.get('$filter');

        data = data || {};

        this.id = data.metric_id;
        this.sort = data.sort;
        this.symbol = data.symbol === '\\u00a3' ? '£' : data.symbol;

        this.drillDown = data.drillDown;

        this.metric = {
            name: data.metric_name,
            id: data.metric_id,
            type: data.metric_type
        };

        this.value = {
            previous: parseFloat(data.control.toFixed(2)),
            current: parseFloat(data.test.toFixed(2)),
            impact: parseFloat(data.impact.toFixed(2)),
            difference: parseFloat(data.difference.toFixed(2)),
            percent: parseFloat((data.difference * 100 / data.control).toFixed(2))
        };

        this.previous = this.formatNumber(this.value.previous);
        this.current = this.formatNumber(this.value.current);
        this.impact = this.formatNumber(this.value.impact);
        this.difference = this.formatNumber(this.value.difference);
        this.percent = this.formatPercent(this.value.percent);

        this.goal = data.metric_type === 'goal';
    
        this.originalData = data;
    }
    
    setGoal(impact) {
        this.goalImpact = impact;
        this.impact = this.$filter('value')(this.value.impact, {symbol: this.goalImpact.symbol}, false);
        this.impactIsGood = this.goalImpact.isIncrease && this.value.impact > 0 || !this.goalImpact.isIncrease && this.value.impact <= 0;
    }

    get isGood() {
        return this.isIncrease && this.value.impact > 0 || !this.isIncrease && this.value.impact <= 0;
    }

    get isIncrease() {
        if(_.isBoolean(this.originalData.isIncrease)) return this.originalData.isIncrease;
        
        return this.value.impact > 0;
    }

    formatNumber(number) {
        return this.$filter('value')(number, {symbol: this.symbol}, false);
    }

    formatPercent(number) {
        return this.$filter('value')(number, {symbol: '%'}, false);
    }
}
