'use strict';

import {AlertModel} from './alerts.model.js';
import {Collection} from '../data/collection.js';

export class AlertsCollection extends Collection {
    constructor($injector) {
        super();
        this.idMap = {};
        this.$injector = $injector;
    }

    static create(data, $injector) {
        return new AlertModel(data, $injector);
    }

    add(data, card) {
        let alert = AlertsCollection.create(data, this.$injector);
        // Link current card object to alert in order to get metric details
        alert.card = card;
        this.items.push(alert);
        this.idMap[alert.id] = alert;
        this.trigger('added', alert);
        return alert;
    }

    removeItem(alert) {
        let index = this.items.findIndex((item) => item.id === alert.id);

        if(index >= 0) {
            this.removeByIdx(index);
            delete this.idMap[alert.id];
            this.trigger('removed', alert);
        }
    }

    getById(id) {
        return this.idMap[id] || null;
    }

    clear() {
        super.clear();
        this.idMap = {};
        this.trigger('clear');
    }
}
