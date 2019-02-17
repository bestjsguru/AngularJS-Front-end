'use strict';

import {Config} from '../../config';
import DateRangeHelper from '../../common/dateRange.helper';
import FiltersModule from "../../common/filters/filters.module";

export default class ConvertFilter {
    constructor() {
        /** @type {DateRangeHelper} **/
        this.DateRangeHelper = new DateRangeHelper();
    }

    toText(filter) {
        let operator = FiltersModule.all.find(item => item.value == filter.operator);
        let value = this.parseValue(filter);

        return `<span class="filter text-capitalize">${filter.column.getLabel()}</span> ${operator.label} ${value}`;
    }

    parseValue(filter) {
        // When we apply filter with operator 'is not NULL' it has 'NULL' in both operator name and value
        // so we would end up with 'is not NULL NULL' when we convert it to string
        if(filter.firstValue === 'NULL') return '';

        if(filter.isRange) {
            return this.DateRangeHelper.getRangeLabelFromName(filter.firstValue, filter.numbers);
        }

        if(filter.column.isDate) {
            return moment(filter.firstValue).format(Config.dateFormats.regular);
        }
    
        return filter.values.join(', ');
    }
}
