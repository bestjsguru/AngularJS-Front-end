'use strict';

import {Config, DATE_RANGE_CUSTOM_VALUE} from '../config.js';

export default class DateRangeHelper {
    constructor() {
        this.ranges = Config.dateRanges;
    }

    getRangeLabelFromName(rangeName, numbers = {}) {
        let range = this.getRangeObjectByName(rangeName) || {};

        return this.getLabel(range, numbers);
    }

    getRangeObjectByName(name, ranges = this.ranges) {
        let range;
        for(let i = 0; i < ranges.length; i++) {
            for(let j = 0; j < ranges[i].ranges.length; j++) {
                if(ranges[i].ranges[j].value == name) {
                    range = ranges[i].ranges[j];
                    break;
                }
            }
        }

        return range;
    }

    getLabel(range, numbers = {}){
        const rangeName = range.value;

        if (!rangeName) return '';

        const foundRangeObj = this.getRangeObjectByName(rangeName) || {};
        let label = foundRangeObj.label || '';

        if(this.isCustomDate(range)){
            const replacingMap = {
                'X': numbers.from,
                'Y': numbers.to
            };

            label = label.replace(/X|Y/g, function(matched) {
                return replacingMap[matched];
            });
        }

        return label;
    }

    isCustomDate(range){
        return range.value === DATE_RANGE_CUSTOM_VALUE;
    }
}
