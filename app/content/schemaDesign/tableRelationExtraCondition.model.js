'use strict';

import {EventEmitter} from '../system/events.js';

export class TableRelationExtraConditionModel extends EventEmitter {
    constructor(data) {
        super();

        data = data || {};

        this.init(data);
    }

    init(data, tableData) {
        this.id = data.id;
        this.operator = data.operator;
        this.sourceColumnExtraFunction = data.sourceColumnExtraFunction;
        this.targetColumnExtraFunction = data.targetColumnExtraFunction;
        this.chainLetter = data.chainLetter;
        this.tableRelationId = data.tableRelationId;
    }


}


