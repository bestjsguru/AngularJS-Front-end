'use strict';

import {FiltersController} from '../../common/filters.controller.js';
import {FilterDTO} from './dto/FilterDTO';
import {FilterFormModel} from '../../common/filterForm.model';
import {OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES, EMPTY_STRING_PLACEHOLDER} from "../../common/filters/filters.module";
import {Config} from '../../config.js';

export class MetricFiltersController extends FiltersController {
    constructor(MetricFiltersFactory, toaster, DeregisterService, $scope, $rootScope, DataProvider, uibDateParser) {
        super($scope, toaster, DeregisterService, DataProvider);
        this.$rootScope = $rootScope;
        this.MetricFiltersFactory = MetricFiltersFactory;
        this.uibDateParser = uibDateParser;
        this.user = window.Auth.user;
        
        this.watchers.watch(() => this.metric.id, () => this.init());
    }

    init() {
        /** @type {MetricFilters} **/
        this.metricFilters = this.MetricFiltersFactory.create(this.metric);
        this.showLoader = true;
        this.filterLoader = [];
        this.forms = {};
        this.filtersRuleForm = {};
        this.availableColumns = [];
        this.filtersRuleLoading = false;
        this.format = Config.dateFormats.regularDatePicker;

        this.initAvailableColumns()
            .then(() => this.initFilters())
            .finally(() => this.showLoader = false);

        this.watchers.onRoot('metric.columns.updated', () => {
            this.initAvailableColumns(false);
            console.log('reload');
        });
    }

    initFilters() {
        this.filters = [];
        return this.metricFilters.init()
            .catch(error => console.error(error))
            .then(() => {
                this.metricFilters.forEach(filter => {
                    if (filter.chainLetter) return;
                    filter.chainLetter = this.getNextAvailableChainLetter(this.metricFilters);
                    filter.metric = {id: this.metric.rawId};
                    this.metricFilters.update(filter);
                });
            })
            .then(() => {
                this.metricFilters.forEach(filter => this.addExistingFilter(filter));
                this.filtersRule = this.metricFilters.rules;
                this.filters.forEach(filter => {
                    if (this.shouldBeConvertedToDateObject(filter)) {
                        filter.firstValue = this.uibDateParser.parse(filter.firstValue, this.format);
                    }
                });
            });
    }

    initAvailableColumns(useCache = true) {
        return this.metricFilters.loadAvailableColumns(useCache).then(columns => {
            this.availableColumns = columns;
            
            // Sort available columns by name
            this.availableColumns.sort((a, b) => {
                return a.getLabel(false).localeCompare(b.getLabel(false));
            });
        });
    }

    noAvailableFiltersMessageIsVisible() {
        return !this.availableColumns.length && !this.showLoader;
    }

    noDefinedFiltersMessageIsVisible() {
        return (!this.filters || !this.filters.length) && !this.showLoader && this.availableColumns.length;
    }

    addNewFilter() {
        var newFilter = new FilterFormModel();
        newFilter.chainLetter = this.getNextAvailableChainLetter(this.filters);
        this.filters.push(newFilter);
    }

    isLoading(index = false) {
        if (index == 'any') {
            var loading = this.filterLoader.some(loading => loading);
            return this.showLoader || loading;
        }
        else if (index !== false) {
            // This checks individual item loader
            return !!this.filterLoader[index];
        }

        return this.showLoader;
    }

    removeFilter(index) {
        //check if it's existing one
        if (this.isAdded(index)) {
            this.filterLoader[index] = true;
            var filter = this.filters[index];

            this.metricFilters.remove(filter.metricFilter)
                .catch(error => console.error(error))
                .then(() => {
                    this.filters.splice(index, 1);
                    this.filtersRule = this.metricFilters.rules;
                    this.toaster.success('Metric filter removed');
                    this.$rootScope.$emit('metric.filtersAmountChanged');
                })
                .finally(() => this.filterLoader[index] = false);
        } else {
            this.filters.splice(index, 1);
        }
    }

    applyFilter(index) {
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

        var request = null;

        this.filterLoader[index] = true;
        this.getForm(index).$setPristine(true);

        var filterValues = ['is', 'is not'].indexOf(filterData.operator.value) > -1
            ? ['NULL']
            : FiltersController.prepareFilterValuesForRequest(filterData.values, Config.dateFormats.grails);

        var filter = new FilterDTO(
            {
                isRange: filterData.isRange,
                column: filterData.column,
                operator: filterData.operator.value,
                values: filterValues,
                chainLetter: filterData.chainLetter,
                customDateMap: filterData.numbers
            },
            this.metric
        );

        if (this.isAdded(index)) {
            filter.chain = filterData.chain || 'AND';
            filter.chainLetter = filterData.chainLetter;
            filter.id = filterData.id;
            request = this.metricFilters.update(filter);
        } else {
            // Add new filter and equip it with new ID
            request = this.metricFilters.add(filter)
                .then(filter => {
                    filterData.metricFilter = filter;
                    filterData.id = filter.id;
                    this.filtersRule = this.metricFilters.rules;
                    this.$rootScope.$emit('metric.filtersAmountChanged');

                });
        }

        request.then((filter) => {
            this.toaster.success('Metric filter applied');
        }).finally(() => {
            this.filterLoader[index] = false;
        });

    }

    isAdded(index) {
        return this.filters[index].id;
    }

    applyFilterRules() {
        if (this.filtersRuleForm.$invalid) return;
        this.filtersRuleLoading = true;

        return this.metricFilters.setRules(this.filtersRule)
            .then(() => this.toaster.success('Filter rules successfully applied'))
            .finally(() => this.filtersRuleLoading = false);
    }

    refreshDates(dates, range, filter) {
        filter.firstValue = range;
        this.setOperators(filter);
    }

    getRangeName(filter) {
        if (filter.firstValue && this.isRangeName(filter.firstValue)) return filter.firstValue;
    }

    setOperators(filter) {
        this.operators.bindToFilter(filter);
    }
    
    onSelectOperator(filter) {
        if(filter.isRange) return;
        
        filter.values = [];
    }
    
    // Check to see if a value is valid range name and not some random string
    isRangeName(value) {
        return Config.dateRanges.reduce((items, range) => items.concat(range.ranges), []).filter((it) => it.value === value).length;
    }
    
    isSelectedOperatorEqualsInOrNotIn(operator) {
        return operator ? OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES.indexOf(operator.value) > -1 : false;
    }
    
    isMultiSelect(filter) {
        return !filter.isDate && this.isSelectedOperatorEqualsInOrNotIn(filter.operator) && this.filterValuesAreVisible(filter);
    }
    
    isSingleSelect(filter) {
        return !filter.isDate && !this.isSelectedOperatorEqualsInOrNotIn(filter.operator) && this.filterValuesAreVisible(filter);
    }

    // If it is single Date value we need to convert to date object
    shouldBeConvertedToDateObject(filter) {
        return filter.column.isDate && !filter.isNullLike() && !filter.isRange && !filter.isBetween();
    }
}

truedashApp.component('tuMetricFilters', {
    bindings: {
        metric: '='
    },
    controller: MetricFiltersController,
    templateUrl: 'content/metricBuilder/metricFilters/metricFilters.html'
});
