"use strict";

import {FilterModel} from '../card/model/filter.model';
import {OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES, EMPTY_STRING_PLACEHOLDER} from './filters/filters.module';
import {FilterFormModel} from './filterForm.model';
import {FiltersOperatorModel} from './filters/filters.operators.model';
import {Config} from '../config';
import {Helpers} from './helpers';

export class FiltersController {
    constructor($scope, toaster, DeregisterService, DataProvider) {
        this.toaster = toaster;
        this.DataProvider = DataProvider;
        /** @type {DeregisterService} **/
        this.watchers = DeregisterService.create($scope);

        this.operators = new FiltersOperatorModel();
        this._formatForMoment = Config.dateFormats.regular;
        
        this.initDateStateModel();
    }

    addExistingFilter(filter) {
        let newFilter = this.prepareExistingFilter(filter);
        this.filters.push(newFilter);
        
        this.filters.sort((a, b) => a.chainLetter.localeCompare(b.chainLetter));
    }

    prepareExistingFilter(filter) {
        let newFilter = new FilterFormModel();
        newFilter.id = filter.id;
        newFilter.chainLetter = filter.chainLetter;
        newFilter.chain = filter.chain;
        newFilter.metricFilter = filter;
        newFilter.numbers = filter.numbers;

        newFilter.setColumn(this.availableColumns.find(item => item.id == filter.column.id));
        if (!newFilter.column) {
            console.warn(`Missing column - column id: ${filter.column.id}, filter id: ${filter.id}`);
            return;
        }

        newFilter.operator = filter.operator;
    
        newFilter.values = filter.values;
        newFilter.isRange = filter.isRange;
        
        if(newFilter.column.isDate && !newFilter.isRange){
            newFilter.values = [moment(filter.firstValue).format(this._formatForMoment)];
        }
        
        if (filter.isRange) newFilter.isDate = true;

        // replace empty strings with '' symbol pair
        newFilter.values = newFilter.values.map(item => item.length ? item : EMPTY_STRING_PLACEHOLDER);

        this.operators.bindToFilter(newFilter);

        return newFilter;
    }

    static prepareFilterValuesForRequest(values, format) {
        return values.reduce((items, value) => {
            if (angular.isDate(value)) {
                items.push(moment(Helpers.formatToDateString(value)).format(format));
            } else if (angular.isString(value) && ['empty', 'blank'].indexOf(value.toLowerCase()) > -1) {
                items.push('blank');
            } else {
                items.push(value);
            }
            
            return items;
        }, []);
    }
    
    /**
     * @param {ColumnEntityModel} column
     * @param {FilterFormModel} filter
     */
    onColumnSelect(column, filter) {
        filter.setColumn(column);
        
        this.operators.bindToFilter(filter);
        
        column.value = undefined;
        filter.operator = undefined;
        filter.values = [];
        filter.isRange = false;
    }

    getNextAvailableChainLetter(filters = this.filters) {
        var letter;
        for (var key in Helpers.alphabet) {
            letter = Helpers.alphabet[key];
            if (!filters.find(filter => filter.chainLetter == letter)) {
                break;
            }
        }
        return letter;
    }

    getForm(index) {
        return this.forms['filter_' + index + '_form'];
    }

    validateFormFields(index, fieldsArray, triggerValidation = false) {
        var formIsValid = true;
        var form = this.getForm(index);

        fieldsArray.forEach((formControl) => {
            if (!form[formControl]) return;

            if(triggerValidation) {
                // Mark all fields as dirty because that will trigger validation
                form[formControl].$dirty = true;
                form[formControl].$pristine = false;
            }

            // Check if field is invalid
            if (form[formControl].$dirty && form[formControl].$invalid) formIsValid = false;
        });

        return formIsValid;
    }

    filterValuesAreVisible(filter) {
        var show = filter.column && filter.operator;
        
        if (filter.filterOperator) {
            show = show && !['is', 'is not'].includes(filter.filterOperator.value);
        }
        
        if (!show) filter.values = [];
        
        return show;
    }

    updateFilterLetters() {
        this.filters.forEach((filter, idx) => {
            if (filter.cardFilter) {
                filter.chainLetter = filter.cardFilter.chainLetter;
            } else {
                filter.chainLetter = Helpers.alphabet[idx];
            }
        });
    }

    //@todo: should be replaced to own component/service/mixin
    initDateStateModel(){
        this.dateData = {};
    }

    openDatePicker($event, id) {
        $event.preventDefault();
        $event.stopPropagation();

        this.dateData[id] = true;
    }
}
