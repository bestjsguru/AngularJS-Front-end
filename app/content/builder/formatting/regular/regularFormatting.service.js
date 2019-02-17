'use strict';

class RegularFormattingService {
    constructor(DataProvider, $q) {
        this.$q = $q;
        this.DataProvider = DataProvider;
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
            {label: 'No decimal', value: 0},
            {label: '1 decimal', value: 1},
            {label: '2 decimals', value: 2},
            {label: '3 decimals', value: 3},
            {label: '4 decimals', value: 4},
            {label: '5 decimals', value: 5},
            {label: '6 decimals', value: 6},
            {label: '7 decimals', value: 7},
            {label: '8 decimals', value: 8},
            {label: '9 decimals', value: 9},
            {label: '10 decimals', value: 10},
        ];
    }
}

truedashApp.service('RegularFormattingService', RegularFormattingService);
