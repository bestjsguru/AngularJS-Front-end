'use strict';

import {EventEmitter} from '../../system/events.js';
import {ColumnHelper} from '../datatable/column.helper';

export class ColumnEntityModel extends EventEmitter {
    constructor(data) {
        super();

        data = data || {};

        this.init(data);
    }

    init(data) {
        this.id = data.id;
        this.type = data.type || '';
        this.tableId = data.tableId;
        this.displayName = data.displayName;
        this.hidden = data.hidden;
        this.name = data.name;
        this.label = this.getLabel();
    }

    getLabel(withTableName = false) {
        // We are replacing all underscores _ with spaces to make more readable labels
        let label = this.name ? this.name.replaceAll('_', ' ') : '';

        // If we can, we return more friendly name to users
        if(this.displayName) label = this.displayName;

        if (withTableName && this.tableName)
            return `${label} <small>(${this.tableName})</small>`;

        return label;
    }

    reset() {
        this.init({});
    }

    get isDate() {
        return ColumnHelper.isDateType(this.type);
    }
    
    get isNumber() {
        return ColumnHelper.isNumberType(this.type);
    }

    getJson() {
        return {
            id: this.id,
            type: this.type,
            tableId: this.tableId,
            displayName: this.displayName,
            hidden: this.hidden,
            name: this.name,
            label: this.label
        };
    }
}

truedashApp.value('ColumnEntityModel', ColumnEntityModel);
