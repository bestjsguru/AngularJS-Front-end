'use strict';

export default class ApiaiModel {
    constructor(data, $injector) {
        this.data = data || {};
    }
    
    isError() {
        return this.data.result.action === 'input.unknown';
    }
    
    get message() {
        return this.data.result.fulfillment.speech;
    }
    
    get metricName() {
        return this.data.result.parameters.Metric;
    }
    
    get date() {
        let date = moment(this.data.result.parameters.date, 'YYYY-MM-DD').startOf('day');
        
        if(!date.isValid()) date = null;
        
        return date;
    }
    
    get dateRange() {
        let period = this.data.result.parameters['date-period'];
        
        if(!period.includes('/')) return null;
        
        let [from, to] = period.split('/');
        
        from = moment(from, 'YYYY-MM-DD').startOf('day');
        to = moment(to, 'YYYY-MM-DD').endOf('day');
        
        if(!from.isValid() || !to.isValid()) return null;
        
        return {from, to};
    }
    
    get dateString() {
        return this.date ? this.date.format('YYYY-MM-DD') : '';
    }
    
    get dateRangeString() {
        if(!this.dateRange) return '';
        
        return this.dateRange.from.format('YYYY-MM-DD') + ' / ' + this.dateRange.to.format('YYYY-MM-DD');
    }
    
    get range() {
        let data = this.dateRange ? this.dateRange : {from: this.date, to: this.date};
        
        data = {
            from: data.from ? data.from.startOf('day') : moment().subtract(1, 'y').startOf('day'),
            to: data.to ? data.to.endOf('day') : moment().endOf('day'),
        };
        
        data.fromString = data.from.format('YYYY-MM-DD HH:mm:ss');
        data.toString = data.to.format('YYYY-MM-DD HH:mm:ss');
        
        return data;
    }
    
    get frequency() {
        let days = this.range.to.diff(this.range.from, 'days');
        let months = this.range.to.diff(this.range.from, 'months');
        
        if(months >= 36) return 'Yearly';
        if(months >= 3) return 'Monthly';
        if(days >= 28) return 'Weekly';
        
        return 'Daily';
    }
};

