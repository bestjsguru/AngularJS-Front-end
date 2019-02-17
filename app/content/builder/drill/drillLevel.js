'use strict';

import {ColumnEntityModel} from '../../card/model/columnEntity.model.js';

class DrillLevel {
    constructor (data = {}) {
        this.data = data;

        this.id = data.id;
        this.column = data.column ? new ColumnEntityModel(data.column) : undefined;
        this.operation = data.operation;
        this.chartType = data.chartType;
        this.added = data.added || false;
    }
}

export default DrillLevel;
