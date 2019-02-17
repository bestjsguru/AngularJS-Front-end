'use strict';

import {Config} from '../config.js';

export const TYPES = {
    SYMBOL: 'symbol',
    TIME: 'time',
    PERCENTAGE: 'percentage'
};

function formatFilter($filter) {
    const currencyFilter = $filter('currency');

    const formatter_map = {
        [TYPES.SYMBOL]: (value, symbol = '') => {
            if(!symbol || symbol === '123') symbol = '';
            if(!value) return null;

            if (symbol || symbol === '') {
                // if value is integer (no decimal places), don't show decimal places
                let countOfDecimals = value % 1 === 0 ? 0 : 2;
                value = currencyFilter(value, '', countOfDecimals);
            }

            let shouldFormatAsSuffix = Config.chartOptions.symbols.suffixed.includes(symbol);

            return shouldFormatAsSuffix ? value + symbol : symbol + value;
        },
        [TYPES.TIME]: value => value.toFixed(2),
        [TYPES.PERCENTAGE]: value => value + '%'
    };

    //@todo: should be replaced whole project to use exported types-map instead of using this one
    let wholeProjectGeneratorsMap = {
        'currency': formatter_map[TYPES.SYMBOL],
        'numeric': formatter_map[TYPES.SYMBOL],
        'line': angular.identity,
        'spline': angular.identity,
        'time': formatter_map[TYPES.TIME],
        'percentage': formatter_map[TYPES.PERCENTAGE],
        'default': angular.identity
    };

    return function (value, formatting) {

        const symbol = formatting.symbol;
        let type = formatting.type;

        if (type) {
            type = type.toLowerCase();
        }
        else {
            type = 'default';
        }

        if (!wholeProjectGeneratorsMap.hasOwnProperty(type)) {
            type = 'default';
        }

        return (formatter_map[type] || wholeProjectGeneratorsMap[type])(value, symbol);
    };
}

truedashApp.filter('format', formatFilter);
