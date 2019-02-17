'use strict';

import { OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES, EMPTY_STRING_PLACEHOLDER } from "../../common/filters/filters.module";
import { Config } from "../../config.js";
import { FilterFormModel } from "../../common/filterForm.model";
import { FiltersController } from '../../common/filters.controller.js';
import '../../builder/filters/validLogicalExpression.directive';

class MetricFiltersController extends FiltersController {
    constructor($scope, toaster, DeregisterService, DataProvider, uibDateParser, MetricDataService, $q) {
        super($scope, toaster, DeregisterService, DataProvider);

        this.MetricDataService = MetricDataService;
        this.$q = $q;
        this.uibDateParser = uibDateParser;

        this.user = window.Auth.user;
        
        this.loading = false;
        this.forms = {};
        this.filtersRuleForm = {};
        this.availableColumns = [];
        this.filterLoader = [];
        this.filters = [];
        this.format = Config.dateFormats.regularDatePicker;

        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        if (this.viewMode === 'update' && this.existingFilters.length > 0) {
            this.loadAvailableColumnsForMetric(this.metric.value).then(() => {
                this.filters = this.convertExistingRawFilters(this.existingFilters);
                this.setupExistingFilters();
            });
        }

        this.loadAvailableColumnsForMetric(this.metric.value);
    }

    $onChanges(changes) {
        if (changes.existingFilters) {
            if (!changes.existingFilters.isFirstChange()) {
                const filtersCopy = angular.copy(this.existingFilters);
                const notAddedFilters = this.filters.filter(filter => !filter.isAdded);
                this.filters = this.convertExistingRawFilters(filtersCopy);
                this.setupExistingFilters();
                this.filters = [...this.filters, ...notAddedFilters].sort((a, b) => {
                    return a.chainLetter.localeCompare(b.chainLetter);
                });
            }
        }

        if (changes.metric) {
            if (!changes.metric.isFirstChange()) {
                this.filters = [];
                this.loadAvailableColumnsForMetric(this.metric.value);
            }
        }
    }

    convertExistingRawFilters(filters) {
        let items = angular.copy(filters);
        
        return items.map(item => {
            const filter = this.prepareExistingFilter(item);
            filter.isAdded = true;

            return filter;
        });
    }

    setupExistingFilters() {
        this.filters.forEach(filterFormModel => {
            if (this.isSelectedOperatorEqualsInOrNotIn(filterFormModel.filterOperator.value)) return;

            // If it is single Date value we need to convert to date object
            if (this.shouldBeConvertedToDateObject(filterFormModel)) {
                filterFormModel.firstValue = this.uibDateParser.parse(filterFormModel.firstValue, this.format);
            }
        });
    }

    loadAvailableColumnsForMetric(metricId) {
        this.loading = true;
        return this.MetricDataService.loadAvailableColumns(metricId).then(columns => {
            this.availableColumns = columns;
        }).finally(() => {
            this.loading = false;
        });
    }

    addNewFilter() {
        const newFilter = new FilterFormModel();
        newFilter.chainLetter = this.getNextAvailableChainLetter();
        newFilter.isAdded = false;

        this.filters.push(newFilter);
    }

    refreshDates(dates, range, filter) {
        filter.firstValue = range;
        this.setOperators(filter);
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

        this.getForm(index).$setPristine(true);

        const filterValues = ['is', 'is not'].indexOf(filterData.operator.value) > -1
            ? ['NULL']
            : FiltersController.prepareFilterValuesForRequest(filterData.values, Config.dateFormats.grails);

        const { chain, chainLetter, numbers, isRange } = filterData;
        const { hidden, displayName, name, label, id, type } = filterData.column;
        const metricId = this.metric.value;

        const preparedFilter = {
            chain: chain || 'AND',
            chainLetter,
            metric: null,
            customDateMap: numbers,
            column: {
                hidden,
                displayName,
                name,
                label,
                id,
                type
            },
            dataSet: {
                virtualId: metricId
            },
            values: filterValues,
            operator: filterData.operator.value,
            isRange
        };

        if (filterData.isAdded) {
            this.onUpdateFilter({
                $event: {
                    index,
                    filter: preparedFilter
                }
            });
        } else {
            filterData.isAdded = true;
            this.onApplyFilter({
                $event: {
                    filter: preparedFilter
                }
            });
        }
    }

    removeFilter(index) {
        const filter = this.filters[index];
        if (!filter.isAdded) {
            this.filters = this.filters.filter((_, i) => i !== index);
        } else {
            this.onRemoveFilter({
                $event: {
                    index: index
                }
            });
        }
    }

    applyRule(rule) {
        if (this.filtersRuleForm.$invalid) {
            return;
        }

        rule = rule.trim().replace('  ', ' ');

        this.onApplyRule({
            $event: {
                rule
            }
        });
    }

    isLoading(index = false) {
        if (index !== false) {
            // This checks individual item loader
            return !!this.filterLoader[index];
        }

        return this.showLoader;
    }

    onSelectOperator(filter) {
        if(filter.isRange) return;
    
        filter.values = [];
    }

    getRangeName(filter) {
        if (filter.firstValue && this.isRangeName(filter.firstValue)) return filter.firstValue;
    }

    isSelectedOperatorEqualsInOrNotIn(operator) {
        return operator ? OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES.indexOf(operator.value) > -1 : false;
    }

    isMultiSelect(filter) {
        return filter.column && !filter.column.isDate && this.isSelectedOperatorEqualsInOrNotIn(filter.operator) && this.filterValuesAreVisible(filter);
    }

    isSingleSelect(filter) {
        return filter.column && !filter.column.isDate && !this.isSelectedOperatorEqualsInOrNotIn(filter.operator) && this.filterValuesAreVisible(filter);
    }

    setOperators(filter) {
        this.operators.bindToFilter(filter);
    }

    onRangeClick(filter) {
        filter.isRange = !filter.isRange;
        this.setOperators(filter);
    }

    isRangeName(value) {
        return Config.dateRanges.reduce((items, range) => items.concat(range.ranges), []).filter((it) => it.value === value).length;
    }

    shouldBeConvertedToDateObject(filter) {
        return filter.column.isDate && !filter.isNullLike() && !filter.isRange && !filter.isBetween();
    }
}

truedashApp.component('appSmartAlertMetricFilters', {
    bindings: {
        onApplyRule: '&',
        onApplyFilter: '&',
        onRemoveFilter: '&',
        onUpdateFilter: '&',
        viewMode: '<',
        metric: '<',
        rule: '<',
        existingFilters: '<'
    },
    controller: MetricFiltersController,
    templateUrl: 'content/smartAlerts/metricFilters/metricFilters.html'
});
