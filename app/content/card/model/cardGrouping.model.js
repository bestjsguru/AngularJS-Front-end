'use strict';

import {ColumnEntityModel} from './columnEntity.model.js';
import {EventEmitter} from '../../system/events.js';

export class CardGrouping extends EventEmitter {
    constructor(data) {
        super();
        data = data || {};
        this.init(data);
    }

    init(data) {
        this.id = data.id;
        this.name = data.name || '';
        this.column = new ColumnEntityModel(data.column);
        this.applyGroupByNull = !!data.applyGroupByNull;
    
        this.setValues(data.values);
    }
    
    setValues(values) {
        this.values = this.formatValues(values);
    }
    
    getLabel() {
        return this.name || this.column.getLabel();
    }

    update(data) {
        this.init(data);
    }

    reset() {
        this.init({});
    }
    
    get firstValue() {
        return this.values.length ? this.values[0] : undefined;
    }
    
    set firstValue(value) {
        this.values = [value];
    }

    getJson(){
        let data = {
            column: this.column.getJson(),
            values: this.formatValues(this.values),
            applyGroupByNull: this.applyGroupByNull
        };
        
        if(this.name) data.name = this.name;
        
        return data;
    }
    
    formatValues(values) {
        return _.isNull(values) ? values : (values || []).map(value => value.replace(/'+/, "'"));
    }

    clone() {
        return new CardGrouping({
            id: this.id,
            name: this.name,
            values: this.values ? this.values.splice() : [],
            column: this.column,
            applyGroupByNull: !!this.applyGroupByNull
        });
    }
}

