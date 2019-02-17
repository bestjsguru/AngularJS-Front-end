'use strict';

import {ImpactModel} from './impact.model';
import {Collection} from '../../../data/collection';

export class ImpactCollection extends Collection {
    constructor($injector) {
        super();
        this.$injector = $injector;
    }

    static create(data, $injector) {
        return new ImpactModel(data, $injector);
    }

    get actual() {
        return this.items.find(item => item.actual);
    }

    add(data) {
        let item = ImpactCollection.create(data, this.$injector);
        this.items.push(item);
        this.trigger('added', item);
        return item;
    }

    removeItem(impact) {
        let index = this.items.findIndex((item) => item.id === impact.id);

        if(index >= 0) {
            this.removeByIdx(index);
            this.trigger('removed', impact);
        }
    }

    clear() {
        super.clear();
        this.trigger('clear');
    }
}
