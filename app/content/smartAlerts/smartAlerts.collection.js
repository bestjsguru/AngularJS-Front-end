'use strict';

import {SmartAlertsModel} from './smartAlerts.model';
import {Collection} from '../data/collection';

export class SmartAlertsCollection extends Collection {
    constructor($injector) {
        super();
        this.$injector = $injector;
    }

    static create(data, $injector) {
        return new SmartAlertsModel(data, $injector);
    }

    add(data) {
        let item = SmartAlertsCollection.create(data, this.$injector);
        this.items.push(item);
        this.trigger('added', item);
        return item;
    }

    sortSmartAlerts() {
        this.items.sort((a, b) => b.alert.date - a.alert.date);
    }

    removeItem(smartAlerts) {
        let index = this.items.findIndex((item) => item.id === smartAlerts.id);

        if(index >= 0) {
            this.removeByIdx(index);
            this.trigger('removed', smartAlerts);
        }
    }

    clear() {
        super.clear();
        this.trigger('clear');
    }
}
