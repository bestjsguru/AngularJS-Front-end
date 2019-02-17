'use strict';

import {Collection} from '../data/collection';
import AnomalyModel from './anomaly.model';

export class CardAnomalies extends Collection {
    constructor(anomalies, metric, $injector) {
        super();
        this.$injector = $injector;
        
        anomalies = anomalies || [];
        anomalies = anomalies.filter(anomaly => anomaly.isAnomaly);
        
        anomalies.forEach(item => this.add({
            metric: metric,
            anomaly: item,
        }));
    }
    
    read(data) {
        let anomaly = this.has(data);
        
        if(anomaly) {
            anomaly.read();
            this.trigger('updated');
            return true;
        }
        
        return false;
    }
    
    unread(data) {
        let anomaly = this.has(data);
        
        if(anomaly) {
            anomaly.unread();
            this.trigger('updated');
            return true;
        }
        
        return false;
    }
    
    has(data) {
        return this.items.find(item => item.alert.id === data.alert.id);
    }

    add(data) {
        let item = new AnomalyModel(data, this.$injector);
        this.items.push(item);
        this.trigger('added', item);
        return item;
    }

    removeItem(anomaly) {
        let index = this.items.findIndex((item) => item.alert.id === anomaly.alert.id);

        if(index >= 0) {
            this.removeByIdx(index);
            this.trigger('removed', anomaly);
        }
    }
    
    readAll() {
        this.items = this.items.map(item => item.read());
        this.trigger('updated');
    }
    
    hasUnreads() {
        return !! this.unreadCount();
    }
    
    unreadCount() {
        return this.items.filter(item => item.alert.read === false).length;
    }
    
    last() {
        return this.items[this.items.length - 1];
    }

    clear() {
        super.clear();
        this.trigger('clear');
    }
    
    getIndex(anomaly) {
        return this.items.findIndex((item) => item.alert.id === anomaly.alert.id);
    }
}

truedashApp.service('CardAnomaliesFactory', ($injector) => ({
    create: (anomalies, metric) => new CardAnomalies(anomalies, metric, $injector)
}));
