'use strict';

import OPERATORS from './filters.module';

export class FiltersOperatorModel {

    constructor() {
        this.weakMap = new WeakMap();
    }

    /**
     * @param {FilterFormModel} filter
     * @private
     */
    static chooseOperatorsList(filter){
        let operators = OPERATORS.all;

        if(filter.isDate){
            operators = OPERATORS.date;

            if(filter.isRange){
                if (filter.firstValue && !angular.isDate(filter.firstValue) && filter.firstValue.toUpperCase() === 'TODAY') {
                    operators = OPERATORS.rangeNameDependent;
                } else {
                    operators = OPERATORS.range;
                }
            }
        }

        return operators;
    }

    /**
     * @param {FilterFormModel} filter
     */
    bindToFilter(filter){
        this.weakMap.set(filter,  FiltersOperatorModel.chooseOperatorsList(filter));

        const list = this.getByFilter(filter);
        if(list.length === 1){
            filter.operator = list[0];
        }
    }

    /**
     * @param {FilterFormModel} filter
     */
    getByFilter(filter){
        return this.weakMap.get(filter) || [];
    }

    existFor(filter){
        return this.getByFilter(filter).length;
    }
}
