"use strict";

const OPERATORS = [
    {label: 'Equal', value: 'eq', isDate: true, isRange: true, isRangeNameDependent: true, isNumber: true},
    {label: 'Greater than', value: 'gt', isDate: true, isNumber: true},
    {label: 'Greater than or equal to', value: 'gte', isDate: true, isRangeNameDependent: true, isNumber: true},
    {label: 'In', value: 'in', isNumber: true},
    {label: 'Is NULL', value: 'is', isDate: true, isNumber: true},
    {label: 'Is not NULL', value: 'is not', isDate: true, isNumber: true},
    {label: 'Less than', value: 'lt', isDate: true, isNumber: true},
    {label: 'Less than or equal', value: 'lte', isDate: true, isNumber: true},
    {label: 'Not equal', value: 'ne', isDate: true, isNumber: true},
    {label: 'Not in', value: 'ni', isNumber: true},
    {label: 'Not like', value: 'nl', isNumber: true},
    {label: 'Like', value: 'li', isNumber: true},
    {label: 'Between', value: 'between'}
];

export const OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES = ['in', 'ni'];

export const EMPTY_STRING_PLACEHOLDER = "''";

export const DASHBOARD_FILTER_MODEL_TYPES = [{label: 'field'}, {label: 'date'}];

export default {
    get range(){
        return OPERATORS.filter(item => item.isRange);
    },

    get rangeNameDependent() {
        return OPERATORS.filter(item => item.isRangeNameDependent);
    },

    get date(){
        return OPERATORS.filter(item => item.isDate);
    },

    get all(){
        return OPERATORS.filter(item => item.isNumber);
    }
};
