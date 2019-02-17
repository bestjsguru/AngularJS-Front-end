'use strict';

import {EventEmitter} from '../../system/events.js';

export class TableModel extends EventEmitter {
    constructor(data) {
        super();

        data = data || {};

        this.init(data);
    }

    init(data) {
        this.id = data.id;
        this.columns = data.columns;
        this.name = data.name;
        this.position = data.position;
        this.dataSource = data.dataSource;
        this.statement = data.statement;
        this.type = data.type;
    }

    reset() {
        this.init({});
    }

    get label() {
        return this.name.substring(this.name.indexOf(".") + 1);
    }

    get source() {
        return _.isObject(this.dataSource) ? this.dataSource.name : null;
    }

    get isDerived() {
        return this.type === 'derived';
    }
}

truedashApp.value('TableModel', TableModel);
