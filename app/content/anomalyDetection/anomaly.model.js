'use strict';

var Highcharts = require('highcharts');

export default class AnomalyModel {
    constructor(data, $injector) {

        this.$filter = $injector.get('$filter');

        data = data || {};

        if(!data.anomaly || !data.metric) throw new Error('Invalid anomaly object');

        this.anomaly = data.anomaly;
        this.metric = data.metric;

        this.alertLevel = data.anomaly.alertLevel;
        this.data = data.anomaly.data;
        this.expectedValue = this.formatNumber(data.anomaly.expectedValue);
        this.isAnomaly = data.anomaly.isAnomaly;
        this.isGood = data.anomaly.isGood;
        this.lowerBound = this.formatNumber(data.anomaly.lowerBound);
        this.upperBound = this.formatNumber(data.anomaly.upperBound);
        this.value = this.formatNumber(data.anomaly.value);
        this.variance = this.formatPercent(data.anomaly.variance);
        
        this.alert = {
            id: data.anomaly.alertId,
            read: data.anomaly.smartAlertRead,
            smartAlertId: data.anomaly.smartAlertId,
        };
    }
    
    read() {
        this.alert.read = true;
        
        return this;
    }
    
    unread() {
        this.alert.read = false;
        
        return this;
    }

    formatNumber(number) {
        if(window.isDemo) return this.$filter('value')(number, {symbol: '£'}, false);

        return Highcharts.numberFormat(number, 2, '.', ',');
    }

    formatPercent(number) {
        return Highcharts.numberFormat(number * 100, 0, '.', ',') + '%';
    }

    get isIncrease() {
        return this.anomaly.variance > 0;
    }

    get rangeString() {
        return `${this.lowerBound} - ${this.upperBound}`;
    }

    get shortValue() {
        if(window.isDemo) return this.$filter('value')(this.anomaly.value, {symbol: '£'});

        return this.$filter('value')(this.anomaly.value);
    }

    get formatedDate() {
        return moment(this.anomaly.data).format('dddd, MMMM Do, YYYY');
    }
}
