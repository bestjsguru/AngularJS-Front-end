'use strict';

export default class DriverModel {
    constructor(data) {

        this.$filter = window.$injector.get('$filter');

        data = data || {};

        this.metric_id = parseInt(data.metric_id) || {};
        this.name = data.name || '';
        this.letter = data.equation_symbol || '';

        this.resetValues();
    }

    resetValues() {
        this.current = null;
        this.previous = null;
        this.difference = null;
        this.contribution = null;
        this.percent = null;
    }

    setValues(values) {
        if(!values) return this.resetValues();
    
        this.symbol = values.symbol === '\\u00a3' ? '£' : values.symbol;
        
        this.current = this.formatNumber(values.current);
        this.previous = this.formatNumber(values.previous);
        this.difference = this.formatNumber(values.difference);
        this.percent = this.formatPercent(values.percent);
    }

    setContribution(value) {
        this.contribution = this.formatNumber(value);
    }

    formatNumber(number) {
        return number ? this.$filter('value')(number, {symbol: this.symbol}, true) : null;
    }

    formatPercent(number) {
        return number ? this.$filter('value')(number, {symbol: '%'}, false) : null;
    }
}
