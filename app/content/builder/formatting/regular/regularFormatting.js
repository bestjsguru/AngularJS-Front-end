'use strict';

import {Helpers} from '../../../common/helpers';
import {ColumnHelper} from '../../../card/datatable/column.helper';

export default class RegularFormatting {
    constructor(card) {
        this.card = card;
        this.items = [];
    }
    
    init(items) {
        this.items = items;
    }
    
    check(value, columns, results, columnIndex, rowIndex) {
        let formatting = {
            color: null,
            textColor: null,
            decimals: null,
            useShortNumbers: false,
            commaSeparator: true,
            align: 'left',
            prefix: '',
            suffix: '',
        };
        
        let fulfilledAtLeastOneCondition = false;
        let columnName = columns[columnIndex];
        let values = results.map(row => row[columnIndex]);
        
        this.getJson().some(item => {
            
            item.columns.forEach(column => {
                let fulfilled = false;
                let isNumber = ColumnHelper.isNumberType(column.columnType);
                
                if((column.dimensionName || column.label || column.name) === columnName) {
                    fulfilled = this.validate(item, value, values, isNumber, column.columnType.toLowerCase());
                } else if(item.type === 'row') {
                    let conditionColumnIndex = columns.findIndex(item => item === (column.dimensionName || column.label || column.name));
                    let columnValues = results.map(row => row[conditionColumnIndex]);
                    let rowValue = columnValues[rowIndex];
    
                    fulfilled = this.validate(item, rowValue, columnValues, isNumber, column.columnType.toLowerCase());
                }
                
                if(fulfilled) {
                    fulfilledAtLeastOneCondition = true;
                    
                    if(item.color !== false && _.isNull(formatting.color)) {
                        formatting.color = item.color;
                    }
                    
                    if(item.textColor !== false && _.isNull(formatting.textColor)) {
                        formatting.textColor = item.textColor;
                    }
                    
                    if(item.decimals !== false && _.isNull(formatting.decimals)) {
                        if(this.card.metrics.columnIsNumeric(columnIndex)) {
                            formatting.decimals = item.decimals;
                        }
                    }
                    
                    if(item.useShortNumbers !== false && formatting.useShortNumbers === false) {
                        if(this.card.metrics.columnIsNumeric(columnIndex)) {
                            formatting.useShortNumbers = item.useShortNumbers;
                        }
                    }
                    
                    if(item.commaSeparator !== true && formatting.commaSeparator === true) {
                        if(this.card.metrics.columnIsNumeric(columnIndex)) {
                            formatting.commaSeparator = item.commaSeparator;
                        }
                    }
                    
                    if(item.align !== 'left' && formatting.align === 'left') {
                        formatting.align = item.align;
                    }
                    
                    if(item.prefix.length && _.isEmpty(formatting.prefix)) {
                        formatting.prefix = item.prefix;
                    }
                    
                    if(item.suffix.length && _.isEmpty(formatting.suffix)) {
                        formatting.suffix = item.suffix;
                    }
                }
                
                // If we found all values no need to search anymore so we just return true and that will stop the loop
                return !_.isNull(formatting.color) &&
                       !_.isNull(formatting.textColor) &&
                       !_.isNull(formatting.textColor) &&
                       (this.card.metrics.columnIsNumeric(columnIndex) && !_.isNull(formatting.decimals)) &&
                       (this.card.metrics.columnIsNumeric(columnIndex) && formatting.useShortNumbers !== false) &&
                       (this.card.metrics.columnIsNumeric(columnIndex) && formatting.commaSeparator !== true) &&
                       formatting.align !== 'left' &&
                       !_.isEmpty(formatting.prefix) &&
                       !_.isEmpty(formatting.suffix);
            });
        });
        
        return fulfilledAtLeastOneCondition ? formatting : null;
    }
    
    validate(item, value, values, isNumber, type) {
        let fulfilled = false;
        
        switch(item.operator) {
            case 'eq':
                if(isNumber) {
                    fulfilled = this.valuesAreNumbers(item, value) && this.formatValue(item, value) === this.formatValue(item, item.value);
                } else {
                    fulfilled = (String(value) || '').toLowerCase() === (String(item.value) || '').toLowerCase();
                }
                
                break;
            case 'gt':
                fulfilled = (isNumber && this.valuesAreNumbers(item, value) || type === 'time') && this.formatValue(item, value) > this.formatValue(item, item.value);
                break;
            case 'gte':
                fulfilled = (isNumber && this.valuesAreNumbers(item, value) || type === 'time') && this.formatValue(item, value) >= this.formatValue(item, item.value);
                break;
            case 'lt':
                fulfilled = (isNumber && this.valuesAreNumbers(item, value) || type === 'time') && this.formatValue(item, value) < this.formatValue(item, item.value);
                break;
            case 'lte':
                fulfilled = (isNumber && this.valuesAreNumbers(item, value) || type === 'time') && this.formatValue(item, value) <= this.formatValue(item, item.value);
                break;
            case 'between':
                fulfilled = (isNumber && _.isNumber(this.formatValue(item, value)) || type === 'time') && this.isBetween(item, value);
                break;
            case 'aa':
                fulfilled = (isNumber && _.isNumber(this.formatValue(item, value)) || type === 'time') && this.isAboveAverage(item, value, values);
                break;
            case 'ba':
                fulfilled = (isNumber && _.isNumber(this.formatValue(item, value)) || type === 'time') && this.isBelowAverage(item, value, values);
                break;
            case 'default':
                fulfilled = true;
                break;
        }
        
        return fulfilled;
    }
    
    isBetween(item, value) {
        let formattedValue = this.formatValue(item, value);
        
        return formattedValue >= this.formatValue(item, item.value) && formattedValue <= this.formatValue(item, item.valueTo);
    }
    
    formatValue(item, value) {
        value = _.cloneDeep(value);
        
        if(value && value.comparableFormatted !== undefined) value = value.comparableFormatted;
        
        if(value === null || value === '') return '';
        
        return Helpers.toNumber(value);
    }
    
    getJson() {
        let items = this.items.map(item => {
            return {
                columns: item.columns,
                type: item.type,
                decimals: _.isUndefined(item.decimals.value) ? item.decimals : item.decimals.value,
                operator: _.isUndefined(item.operator.value) ? item.operator : item.operator.value,
                value: item.value,
                valueTo: item.valueTo,
                color: item.color,
                textColor: item.textColor,
                useShortNumbers: !! item.useShortNumbers,
                commaSeparator: _.isBoolean(item.commaSeparator) ? item.commaSeparator : true,
                align: item.align || 'left',
                prefix: item.prefix || '',
                suffix: item.suffix || '',
            };
        });
    
        // Remove metrics and dimensions that doesn't exist on card level
        items = items.filter(item => {
            item.columns = item.columns.filter(column => {
                if(column.type === 'dimension') {
                    return this.card.groupings.items.find(grouping => {
                        return column.id === grouping.column.id;
                    });
                }
    
                return this.card.metrics.items.find(item => {
                    return column.id === this.card.metrics.getMetricId(item);
                });
            });
            
            return item.columns.length;
        });
        
        return items;
    }
    
    isAboveAverage(item, value, values) {
        let average = values.reduce((a, b) => this.formatValue(item, a) + this.formatValue(item, b)) / values.length;
        
        return this.formatValue(item, value) > average;
    }
    
    isBelowAverage(item, value, values) {
        let average = values.reduce((a, b) => this.formatValue(item, a) + this.formatValue(item, b)) / values.length;
        
        return this.formatValue(item, value) < average;
    }
    
    valuesAreNumbers(item, value) {
        let conditionValueIsNumber = !_.isNaN(_.toNumber(item.value));
        
        return _.isNumber(this.formatValue(item, value)) && conditionValueIsNumber;
    }
}
