'use strict';

import OPERATORS from './filters/filters.module';
import {RangeModel} from './models/range.model';

export class FilterFormModel {

    constructor() {
        this.column = null;
        this.filterOperator = null;
        this.values = [];
        this.chainLetter = '';
        this.chain = '';
        this.isDate = false;
        this.cardFilter = null;
        this.isRange = false;
        this.isLoading = false;
        this.filterNumbers = new RangeModel();

        //@todo: why do we need a few props that in diff time is storing original filter?
        this.cardFilter = null;
        this.metricFilter = null;
    }

    /**
     * @param {ColumnEntityModel} column
     */
    setColumn(column){
        if(!column) return;

        this.column = column;
        this.isDate = !!column.isDate;
    }

    isBetween(){
        return this.isDate && (this.filterOperator || {}).value === 'between';
    }

    isNullLike(){
        const operator = (this.filterOperator || {}).value;
        return operator ===  'is not' || operator === 'is';
    }

    set operator(value){
        if(value instanceof Object){
            this.filterOperator = value;
        } else {
            this.filterOperator = OPERATORS.all.find(operator => operator.value === value);
        }
    }

    get operator(){
        return this.filterOperator;
    }

    set numbers(data){
        data = data || {};
        
        this.filterNumbers.from = data.from || 0;
        this.filterNumbers.to = data.to || 0;
    }

    get numbers(){
        return this.filterNumbers;
    }
    
    get firstValue() {
        return (this.values || []).length ? this.values[0] : undefined;
    }
    
    set firstValue(value) {
        this.values = [value];
    }
}
