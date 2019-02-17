'use strict';

import {FiltersController} from "../../../common/filters.controller.js";
import {FilterFormModel} from "../../../common/filterForm.model";
import {OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES, EMPTY_STRING_PLACEHOLDER} from "../../../common/filters/filters.module";
import {Config} from "../../../config.js";
import '../../../builder/filters/validLogicalExpression.directive';
import './entityFilters.service';
import {ColumnEntityModel} from '../../../card/model/columnEntity.model';

class EntityFiltersCtrl extends FiltersController {
    
    constructor($rootScope, $scope, toaster, $q, DeregisterService, DataProvider, uibDateParser, EntityFiltersService) {
        super($scope, toaster, DeregisterService, DataProvider);

        this.$q = $q;
        this.$rootScope = $rootScope;
        this.EntityFiltersService = EntityFiltersService;
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
        if(!this.isAdded(index)) {
            return this.filters.splice(index, 1);
        }
        
        this.filterLoader[index] = true;
        let filter = this.filters[index];
        filter.deleting = true;
        
        let promise = this.EntityFiltersService.remove(filter).then(() => {
            this.filters.splice(index, 1);
            this.$rootScope.$broadcast('entity.filter.deleted', filter);
        }).finally(() => {
            this.filterLoader[index] = false;
        });
    }

    applyFilter(index) {
        /** @type {FilterFormModel} **/
        var filterData = this.filters[index];

        if (filterData.isRange) {
            if (!filterData.firstValue || angular.isDate(filterData.firstValue) || filterData.firstValue.split(".").length === 3) {
                filterData.firstValue = "last12Months";
            }
        } else if (!filterData.isDate) {
            if (this.isSelectedOperatorEqualsInOrNotIn(filterData.operator)) {
                if (filterData.values.length) {
                    filterData.values = filterData.values.map(item => item !== EMPTY_STRING_PLACEHOLDER ? item : "");
                }
            }
        }
        
        // Validate form fields
        var fieldsToValidate = ['filter', 'operator'];
        if (!filterData.isRange) fieldsToValidate.push('value');

        if (!this.validateFormFields(index, fieldsToValidate, true)) return;

        this.filterLoader[index] = true;
        this.getForm(index).$setPristine(true);

        var filterValues = ['is', 'is not'].indexOf(filterData.operator.value) > -1
            ? ['NULL']
            : FiltersController.prepareFilterValuesForRequest(filterData.values, Config.dateFormats.grails);

        var filter = {
            isRange: !!filterData.isRange,
            column: filterData.column.getJson(),
            operator: filterData.operator.value,
            chain: 'AND',
            values: filterValues,
            chainLetter: filterData.chainLetter,
            numbers: filterData.numbers
        };

        let promise = this.$q.when(true);
    
        if (this.isAdded(index)) {
            filter.id = filterData.id;
            filter.chain = filterData.chain || 'AND';
            promise = this.EntityFiltersService.update(filter, this.entity).then(response => {
                this.$rootScope.$broadcast('entity.filter.updated', filter);
            });
        } else {
            // Add new filter and equip it with new ID
            promise = this.EntityFiltersService.create(filter, this.entity).then(response => {
                filterData.id = response.filter.id;
                this.$rootScope.$broadcast('entity.filter.created', filter);
            });
        }
        
        promise.finally(() => {
            this.filterLoader[index] = false;
        });
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
}

truedashApp.component('appEntityFilters', {
    controller: EntityFiltersCtrl,
    templateUrl: 'content/profile/organisation/filters/entityFilters.html',
    bindings: {
        existingFilters: '=',
        table: '=',
        entity: '=',
    }
});
