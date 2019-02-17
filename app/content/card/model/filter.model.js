'use strict';

import {ColumnEntityModel} from './columnEntity.model.js';
import {EventEmitter} from '../../system/events.js';
import {RangeModel} from '../../common/models/range.model';

export class FilterModel extends EventEmitter {
    constructor(data) {
        super();

        data = data || {};

        this.init(data);
    }

    init(data) {
        this.update(data);
    }

    update(data) {
        this.id = data.id;
        if (this.card)
            this.card = data.card.id;
        this.chain = data.chain;
        this.chainLetter = data.chainLetter;
        this.column = new ColumnEntityModel(data.column);
        this.metric = data.cardMetricRelationId ? data.cardMetricRelationId.id : null;
        this.isMetricFilter = data.isMetricFilter;
        this.isRange = data.isRange;
        this.dataSetId = data.dataSetId;
        this.hidden = data.hidden;
        this.operator = data.operator;
        this.values = data.values ? data.values.map(value => value.replace(/'+/, "'")) : [];

        this.setNumbers(data.numbers || data.customDateMap);
    }

    reset() {
        this.init({});
    }

    clone() {
        return new FilterModel({
            id: this.id,
            chain: this.chain,
            chainLetter: this.chainLetter,
            column: this.column,
            metric: this.metric,
            isMetricFilter: this.isMetricFilter,
            isRange: this.isRange,
            dataSetId: this.dataSetId,
            hidden: this.hidden,
            operator: this.operator,
            values: this.values,
            number: this.number
        });
    }

    getJson() {
        return {
            chain: this.chain,
            chainLetter: this.chainLetter,
            column: this.column.getJson(),
            metric: this.metric,
            isMetricFilter: this.isMetricFilter,
            isRange: this.isRange,
            hidden: this.hidden,
            operator: this.operator,
            values: this.values.map(value => value.replace(/'+/, "''")),
            customDateMap: this.numbers.getJson(),
            dataSet: {
                virtualId: this.dataSetId
            }
        };
    }

    setNumbers(range){
        if(range instanceof RangeModel){
            this.numbers = range;
        } else {
            this.numbers = new RangeModel(range || {});
        }
    }

    get isDate() {
        return this.column && this.column.isDate;
    }
    
    get firstValue() {
        return this.values.length ? this.values[0] : undefined;
    }
    
    set firstValue(value) {
        this.values = [value];
    }
}

truedashApp.value('FilterModel', FilterModel);
