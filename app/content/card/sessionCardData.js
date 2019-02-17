'use strict';

export default class SessionCardData {
    constructor() {
        this.data = null;
    }
    
    set(response, metric) {
        this.data = {
            from: response.range.from,
            to: response.range.to,
            frequency: response.frequency,
            metric: metric,
        };
    }
    
    metricId() {
        return this.exists() ? this.data.metric.id : null;
    }
    
    preselect(card) {
        if(!this.exists()) return;
        
        card.rangeName = 'custom';
        card.fromDate = this.data.from;
        card.toDate = this.data.to;
        card.frequencies.set(this.data.frequency);
    }
    
    reset() {
        this.data = null;
    }
    
    exists() {
        return !! this.data;
    }
}
