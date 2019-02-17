'use strict';

import {Collection} from '../../data/collection';

export class AutomationCollection extends Collection {
    constructor() {
        super();
    }

    add(automation) {
        if (this.getById(automation.id)) return;

        this.addItem(automation);
    }

    update(automation) {
        var index = this.getIndexById(automation.id);

        index >= 0 && this.set(index, automation);
    }

    remove(automation) {
        this.removeItem(automation);
    }

    getIndexById(id) {
        return this.items.findIndex((item) => item.id === id);
    }
}
