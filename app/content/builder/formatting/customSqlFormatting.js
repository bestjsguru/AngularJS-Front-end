'use strict';

import {Helpers} from '../../common/helpers';
import {ColumnHelper} from '../../card/datatable/column.helper';

export default class CustomSqlFormatting {
    constructor(card) {
        this.card = card;
        this.items = [];
    }
    
    init(items) {
        items = items || [];
        
        if(items.length) {
            // TODO: Validate items array
            
            this.items = items;
        }
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
        
        let columnName = columns[columnIndex];
        let values = results.map(row => row[columnIndex]);
        
        this.getJson().some(item => {
            
            item.columns.forEach(column => {
                let fulfilled = false;
                let isNumber = ColumnHelper.isNumberType(item.columnType);
                
                if(column === columnName) {
                    fulfilled = this.validate(item, value, values, isNumber);
                } else if(item.type === 'row') {
                    let conditionColumnIndex = columns.findIndex(item => item === column);
                    let columnValues = results.map(row => row[conditionColumnIndex]);
                    let rowValue = columnValues[rowIndex];
                    
                    fulfilled = this.validate(item, rowValue, columnValues, isNumber);
                }
                
                if(fulfilled) {
                    
                    if(item.color !== false && _.isNull(formatting.color)) {
                        formatting.color = item.color;
                    }
                    
                    if(item.textColor !== false && _.isNull(formatting.textColor)) {
                        formatting.textColor = item.textColor;
                    }
                    
                    if(item.decimals !== false && _.isNull(formatting.decimals)) {
                        formatting.decimals = item.decimals;
                    }
                    
                    if(item.useShortNumbers !== false && formatting.useShortNumbers === false) {
                        formatting.useShortNumbers = item.useShortNumbers;
                    }
                    
                    if(item.commaSeparator !== true && formatting.commaSeparator === true) {
                        formatting.commaSeparator = item.commaSeparator;
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
                
                // If we found both values no need to search anymore so we just return true and that will stop the loop
                return !_.isNull(formatting.color) &&
                       !_.isNull(formatting.textColor) &&
                       !_.isNull(formatting.decimals) &&
                       formatting.useShortNumbers !== false &&
                       formatting.commaSeparator !== true &&
                       formatting.align !== 'left' &&
                       !_.isEmpty(formatting.prefix) &&
                       !_.isEmpty(formatting.suffix);
            });
        });
        
        return formatting;
    }
    
    validate(item, value, values, isNumber) {
        let fulfilled = false;
        
        switch(item.operator) {
            case 'eq':
                if(isNumber) {
                    fulfilled = this.valuesAreNumbers(item, value) && this.formatValue(item, value) === this.formatValue(item, item.value);
                } else {
                    fulfilled = (value || '').toLowerCase() === (item.value || '').toLowerCase();
                }
                
                break;
            case 'gt':
                fulfilled = isNumber && this.valuesAreNumbers(item, value) && this.formatValue(item, value) > this.formatValue(item, item.value);
                break;
            case 'gte':
                fulfilled = isNumber && this.valuesAreNumbers(item, value) && this.formatValue(item, value) >= this.formatValue(item, item.value);
                break;
            case 'lt':
                fulfilled = isNumber && this.valuesAreNumbers(item, value) && this.formatValue(item, value) < this.formatValue(item, item.value);
                break;
            case 'lte':
                fulfilled = isNumber && this.valuesAreNumbers(item, value) && this.formatValue(item, value) <= this.formatValue(item, item.value);
                break;
            case 'between':
                fulfilled = isNumber && _.isNumber(this.formatValue(item, value)) && this.isBetween(item, value);
                break;
            case 'aa':
                fulfilled = isNumber && _.isNumber(this.formatValue(item, value)) && this.isAboveAverage(item, value, values);
                break;
            case 'ba':
                fulfilled = isNumber && _.isNumber(this.formatValue(item, value)) && this.isBelowAverage(item, value, values);
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
        if(value === null || value === '') return '';
        
        return Helpers.toNumber(value);
    }
    
    getJson() {
        return this.items.map(item => {
            return {
                columns: item.columns.map(column => column.name || column),
                type: item.type,
                columnType: item.columnType || 'decimal',
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
        return _.isNumber(this.formatValue(item, value)) && _.isNumber(this.formatValue(item, item.value));
    }
}
