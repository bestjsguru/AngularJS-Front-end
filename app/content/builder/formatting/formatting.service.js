'use strict';

class FormattingService {
    constructor(DataProvider, $q) {
        this.$q = $q;
        this.DataProvider = DataProvider;
    }
    
    getMetricColumns(metricId) {
        return this.DataProvider.get('metric/getCustomMetricColumns/' + metricId, {}, false);
    }
    
    getOperators() {
        return [
            {label: 'Equal', value: 'eq', string: true},
            {label: 'Greater than', value: 'gt', string: false},
            {label: 'Greater than or equal to', value: 'gte', string: false},
            {label: 'Less than', value: 'lt', string: false},
            {label: 'Less than or equal', value: 'lte', string: false},
            {label: 'Between', value: 'between', string: false},
            {label: 'Above average', value: 'aa', string: false},
            {label: 'Below average', value: 'ba', string: false},
            {label: 'Default', value: 'default', string: true},
        ];
    }
    
    getDecimals() {
        return [
            {label: 'Default', value: false},
            {label: 'No decimal places', value: 0},
            {label: '1 decimal place', value: 1},
            {label: '2 decimal places', value: 2},
            {label: '3 decimal places', value: 3},
            {label: '4 decimal places', value: 4},
            {label: '5 decimal places', value: 5},
            {label: '6 decimal places', value: 6},
            {label: '7 decimal places', value: 7},
            {label: '8 decimal places', value: 8},
            {label: '9 decimal places', value: 9},
            {label: '10 decimal places', value: 10},
        ];
    }
}

truedashApp.service('FormattingService', FormattingService);
