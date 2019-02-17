'use strict';

import {FiltersController} from "../../../common/filters.controller.js";
import {FilterFormModel} from "../../../common/filterForm.model";
import {OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES, EMPTY_STRING_PLACEHOLDER} from "../../../common/filters/filters.module";
import {Config} from "../../../config.js";
import '../../../builder/filters/validLogicalExpression.directive';
import {ColumnEntityModel} from '../../../card/model/columnEntity.model';

class ForecastAnalysisFiltersCtrl extends FiltersController {
    
    constructor($rootScope, $scope, toaster, DeregisterService, DataProvider, uibDateParser) {
        super($scope, toaster, DeregisterService, DataProvider);

        this.$rootScope = $rootScope;
        this.uibDateParser = uibDateParser;
        this.availableColumns = [];
        this.showLoader = false;
        this.filterLoader = [];
        this.filters = [];
        this.forms = {};
        
        this.user = window.Auth.user;
        
        this.format = Config.dateFormats.regularDatePicker;
        
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.watchers.watch('$ctrl.table', () => {
            if(this.table) {
                this.availableColumns = this.table.columns.map(column => new ColumnEntityModel(column));
                
                this.initFilters();
            } else {
                this.reset();
            }
        });
    }

    reset() {
        this.availableColumns = [];
        this.loading = false;
        this.filters = [];
    }
    
    initFilters() {
        this.filters = [];
        
        this.existingFilters.forEach(filter => {
            this.addExistingFilter(filter);
        });
        
        this.filters.forEach(filterFormModel => {
            if (this.isSelectedOperatorEqualsInOrNotIn(filterFormModel.filterOperator.value)) return;
            
            // If it is single Date value we need to convert to date object
            if(this.shouldBeConvertedToDateObject(filterFormModel)) {
                filterFormModel.firstValue = this.uibDateParser.parse(filterFormModel.firstValue, this.format);
            }
        });
    }

    refreshDates(dates, range, filter) {
        filter.firstValue = range;
        this.setOperators(filter);
    }

    getRangeName(filter) {
        if (filter.firstValue && this.isRangeName(filter.firstValue)) return filter.firstValue;
    }

    setOperators(filter){
        this.operators.bindToFilter(filter);
    }

    onRangeClick(filter) {
        filter.isRange = !filter.isRange;
        this.setOperators(filter);
    }

    // Check to see if a value is valid range name and not some random string
    isRangeName(value) {
        return Config.dateRanges.reduce((items, range) => items.concat(range.ranges), []).filter((it) => it.value === value).length;
    }

    isLoading(index = false) {
        if (index !== false) {
            // This checks individual item loader
            return !!this.filterLoader[index];
        }

        return this.showLoader;
    }

    addNewFilter() {
        var newFilter = new FilterFormModel();
        newFilter.chainLetter = this.getNextAvailableChainLetter();
        this.filters.push(newFilter);
    }

    removeFilter(index) {
        let filter = this.filters[index];
        filter.deleting = true;
    
        this.filters.splice(index, 1);
        this.$rootScope.$broadcast('forecastAnalysis.filter.deleted', filter);
    }

    applyFilter(index) {
        /** @type {FilterFormModel} **/
        let filterData = this.filters[index];

        if (filterData.isRange) {
            if (!filterData.firstValue || angular.isDate(filterData.firstValue) || filterData.firstValue.split(".").length === 3) {
                filterData.firstValue = "last12Months";
            }
        } else if (!filterData.isDate) {
            if (this.isSelectedOperatorEqualsInOrNotIn(filterData.operator)) {
                if(filterData.values.length) {
                    filterData.values = filterData.values.map(item => item !== EMPTY_STRING_PLACEHOLDER ? item : "");
                }
            }
        }
        
        // Validate form fields
        let fieldsToValidate = ['filter', 'operator'];
        if (!filterData.isRange) fieldsToValidate.push('value');
    
        if (!this.validateFormFields(index, fieldsToValidate, true)) return;

        this.filterLoader[index] = true;
        this.getForm(index).$setPristine(true);
    
        let filterValues = ['is', 'is not'].indexOf(filterData.operator.value) > -1
            ? ['NULL']
            : FiltersController.prepareFilterValuesForRequest(filterData.values, Config.dateFormats.grails);

        let filter = {
            isRange: !!filterData.isRange,
            column: filterData.column.getJson(),
            operator: filterData.operator.value,
            chain: 'AND',
            values: filterValues,
            chainLetter: filterData.chainLetter,
            numbers: filterData.numbers
        };

        if (this.isAdded(index)) {
            filter.id = filterData.id;
            filter.chain = filterData.chain || 'AND';
            this.$rootScope.$broadcast('forecastAnalysis.filter.updated', filter);
        } else {
            // Add new filter and equip it with new ID
            filterData.id = this.getNextId();
            filter.id = filterData.id;
            this.$rootScope.$broadcast('forecastAnalysis.filter.created', filter);
        }
        
        this.filterLoader[index] = false;
    }

    isAdded(index) {
        return this.filters[index].id;
    }

    isSelectedOperatorEqualsInOrNotIn(operator) {
        return operator ? OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES.indexOf(operator.value) > -1 : false;
    }
    
    onSelectOperator(filter) {
        if(filter.isRange) return;
        
        filter.values = [];
    }

    isMultiSelect(filter) {
        return filter.column && !filter.column.isDate && this.isSelectedOperatorEqualsInOrNotIn(filter.operator) && this.filterValuesAreVisible(filter);
    }

    isSingleSelect(filter) {
        return filter.column && !filter.column.isDate && !this.isSelectedOperatorEqualsInOrNotIn(filter.operator) && this.filterValuesAreVisible(filter);
    }
    
    shouldBeConvertedToDateObject(filter) {
        return filter.column.isDate && !filter.isNullLike() && !filter.isRange && !filter.isBetween();
    }
    
    /**
     * Generate unique id for each filter. We have to prepend it with table id to make it unique
     *
     * @returns {string}
     */
    getNextId() {
        let id = 0;
        let found = true;
        
        do {
            id++;
            found = this.filters.find(filter => filter.id === [this.table.id, id].join('.'));
        } while(found);
        
        return [this.table.id, id].join('.');
    }
}

truedashApp.component('appForecastAnalysisFilters', {
    controller: ForecastAnalysisFiltersCtrl,
    templateUrl: 'content/machineLearning/forecastAnalysis/filters/forecastAnalysisFilters.html',
    bindings: {
        existingFilters: '=',
        table: '=',
    }
});
