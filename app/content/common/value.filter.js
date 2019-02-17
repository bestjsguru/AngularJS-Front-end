'use strict';

import {Helpers} from './helpers';
import {Config} from '../config.js';

truedashApp.filter('value', ($filter, $locale) => {
    return (value, info, letters = true, prefixPositivesWithPlus = false, numberOfDecimals = null, commaSeparator = true) => {
        if(_.get(info, 'type') === 'time') {
            return Helpers.toHHMMSS(value);
        }
        
        var result;
        let formatter = {divideByNumber: 1, appendCharacter: ''};
        
        if(!_.isNumber(numberOfDecimals)) {
            numberOfDecimals = window.Auth.user.organisation.numberOfDecimals;
        }

        // Check if value is negative and convert it to be positive number
        var isNegative = value < 0;
        value = Math.abs(value);

        if (letters) {
            if (value >= 1000000000) {
                formatter = {divideByNumber: 1000000000, appendCharacter: 'B'};
            } else if (value >= 1000000) {
                formatter = {divideByNumber: 1000000, appendCharacter: 'M'};
            } else if (value >= 1000) {
                formatter = {divideByNumber: 1000, appendCharacter: 'K'};
            }
        }

        result = $filter('currency')(Helpers.round(value / formatter.divideByNumber, numberOfDecimals), '', numberOfDecimals);

        // Remove comma separator for thousands so number 1,234.53 will become 1234.53
        if(!commaSeparator) result = result.replaceAll(',', '');
        
        // Remove trailing zeros from numbers like 200.00
        let formats = $locale.NUMBER_FORMATS;
        if (result.indexOf(formats.DECIMAL_SEP + '0'.repeat(numberOfDecimals)) >= 0) {
            let separator = result.indexOf(formats.DECIMAL_SEP);
            result = result.substring(0, separator);
        }

        // Add back appended character
        result = result + formatter.appendCharacter;

        if (_.get(info, 'symbol')) {
            if (!info.symbol || info.symbol === '123') info.symbol = '';

            if (Config.chartOptions.symbols.suffixed.includes(info.symbol)) {
                result = result + info.symbol;
            } else {
                result = info.symbol + result;
            }
        }

        // Convert negative numbers to have parenthesis instead of -
        if (isNegative) result = '-' + result;

        // Check if we need to always show + before positives
        if (prefixPositivesWithPlus && !isNegative) result = '+' + result;

        return result;
    };
});
