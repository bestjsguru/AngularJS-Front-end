'use strict';

import {Config} from '../../config';
import DateRangeHelper from '../../common/dateRange.helper';

export default class ConvertCompare {
    constructor() {
        /** @type {DateRangeHelper} **/
        this.DateRangeHelper = new DateRangeHelper();
    }

    toText(compare) {
        let value = this.parseValue(compare);

        return `<span class="compare text-capitalize">${compare.label}</span> (${compare.metric.label} - ${value})`;
    }

    parseValue(compare) {

        return compare.range.label;

        if(compare.isRange) {
            return this.DateRangeHelper.getRangeLabelFromName(compare.value, compare.numbers);
        }

        if(compare.isNumber) {
            return compare.value.split(',').join(', ');
        }

        if(compare.isDate) {
            return moment(compare.value).format(Config.dateFormats.regular);
        }

        return compare.value;
    }
}
