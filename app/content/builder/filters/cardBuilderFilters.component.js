'use strict';

import {FiltersController} from "../../common/filters.controller.js";
import {FilterFormModel} from "../../common/filterForm.model";
import ConvertFilter from "./convertFilter";
import {OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES, EMPTY_STRING_PLACEHOLDER} from "../../common/filters/filters.module";
import {Config} from "../../config.js";
import {Helpers} from "../../common/helpers";
import './validLogicalExpression.directive';

class CardBuilderFiltersCtrl extends FiltersController {
    /**
     *
     * @param $scope
     * @param toaster
     * @param $q
     * @param DeregisterService
     */
    constructor($scope, toaster, $q, DeregisterService, DataProvider, uibDateParser) {
        super($scope, toaster, DeregisterService, DataProvider);

        this.$q = $q;
        this.uibDateParser = uibDateParser;
        this.filtersRuleLoading = false;
        this.availableColumns = [];
        this.showLoader = false;
        this.filterLoader = [];
        this.filtersRule = '';
        this.filters = [];
        this.forms = {};
        
        this.convertFilter = new ConvertFilter();
        this.format = Config.dateFormats.regularDatePicker;
        
        this.collapsed = true;
        this.metric = undefined;
    }

    $onInit() {
        this.card = this.cardBuilder.card;

        this.watchers.onRoot('cardBuilderMetrics.selectedMetric', (event, metric) => {
            metric ? this.setMetric(metric) : this.reset();
        });
        this.watchers.onRoot('filter.addForColumn', (event, column) => this.addNewFilter(column));
        this.watchers.onRoot('grouping.addForColumn', (event, column) => this.collapsed = true);
        this.watchers.onRoot('cardBuilderMetrics.removedMetric', (event, metric) => {
            if(!this.metric) return;

            if(this.metric.id === metric.id) this.reset();
        });
    }

    toggle() {
        this.collapsed = !this.collapsed;
    }

    get showFilters() {
        return this.card && this.metric && this.filters.length;
    }

    reset() {
        this.loading = false;
        this.filters = [];
        this.metric = undefined;
    }

    setMetric(metric) {
        this.filtersRuleSubmitted = false;
        this.metric = metric;
        this.cardBuilder.filtersTabMetricSelected = metric;
        this.showLoader = true;
        // If there are existing metrics already added to a card we need to initiate filters
        this.availableColumns = [];
        this.filterLoader = [];
        this.loadAvailableColumns().finally(() => {
            this.showLoader = false;
            this.initFilters();
        });
    }

    getCardFilters() {
        return this.card.filters.getByDataSet(this.metric);
    }

    initFilters() {
        this.filters = [];

        // Add existing filters first
        let cardFilters = this.getCardFilters();

        cardFilters.forEach(filter => {
            this.addExistingFilter(filter);
        });

        this.filters.forEach(filterFormModel => {
            if(this.isSelectedOperatorEqualsInOrNotIn(filterFormModel.filterOperator.value)) return;
            
            // If it is single Date value we need to convert to date object
            if(this.shouldBeConvertedToDateObject(filterFormModel)) {
                filterFormModel.firstValue = this.uibDateParser.parse(filterFormModel.firstValue, this.format);
            }
        });

        if (!this.metric.filtersRuleInitiated) {
            this.metric.filtersRule = this.card.id ? this.metric.filtersRule : '';
            this.metric.filtersRuleInitiated = true;
        }

        this.filtersRule = this.metric.filtersRule;
    }

    refreshDates(dates, range, filter) {
        filter.firstValue = range;
        this.setOperators(filter);
    }

    getRangeName(filter) {
        if (filter.firstValue && this.isRangeName(filter.firstValue)) return filter.firstValue;
        
        return this.card.rangeName;
    }

    setOperators(filter){
        if(!filter.firstValue){
            filter.firstValue = this.getRangeName(filter);
        }
        
        this.operators.bindToFilter(filter);
    }

    onRangeClick(filter) {
        filter.isRange = !filter.isRange;
        this.setOperators(filter);
    }

    // Check to see if a value is valid range name and not some random string
    isRangeName(value) {
        return Config.dateRanges.reduce((items, range) => items.concat(range.ranges), []).filter((it) => it.value == value).length;
    }

    isLoading(index = false) {
        if (index !== false) {
            // This checks individual item loader
            return !!this.filterLoader[index];
        }

        return this.showLoader || this.cardBuilder.loading;
    }

    loadAvailableColumns() {
        return this.card.filters.loadAvailableColumnsForMetric(this.metric.rawId).then(response => {

            response.forEach(item => {
                item.metricVirtualId = this.metric.virtualId;
            });

            this.availableColumns = response;
        });
    }

    addNewFilter(column) {
        // make sure filters section is visible
        this.collapsed = false;

        var newFilter = new FilterFormModel();
        newFilter.chainLetter = this.getNextAvailableChainLetter();

        this.onColumnSelect(column, newFilter);
        
        this.filters.push(newFilter);
    }

    removeFilter(index) {
        this.filterLoader[index] = true;
        var filter = this.filters[index];
        filter.deleting = true;
        let promise = this.card.filters
            .remove(filter.metricFilter || filter.cardFilter)
            .then(() => {
                this.filters.splice(index, 1);
                this.filtersRule = this.metric.filtersRule;
                this.onFilterListUpdated();
            })
            .catch(() => this.filters.splice(index, 1))
            .finally(() => this.filterLoader[index] = false);
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
                if ((filterData.values || []).length) {
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

        var filter = {
            card: this.card,
            isRange: !!filterData.isRange,
            dataSetId: this.metric.virtualId,
            column: filterData.column,
            operator: filterData.operator.value,
            chain: 'AND',
            values: filterValues,
            chainLetter: filterData.chainLetter,
            numbers: filterData.numbers
        };

        if (this.isAdded(index)) {
            filter.chain = filterData.chain || 'AND';
            let originalFilter = filterData.cardFilter || filterData.metricFilter;
            this.card.filters.update(filter, originalFilter);
        } else {
            // Add new filter and equip it with new ID
            filter = this.card.filters.add(filter, this.metric);
            filterData.cardFilter = filter;
            this.metric.filtersRule += this.filtersRule === '' ? filter.chainLetter : ' AND ' + filter.chainLetter;
            this.filtersRule = this.metric.filtersRule;
        }
    
        this.card.metrics.loadData().then(() => {
            this.onFilterListUpdated();
            this.toaster.success('Card filter applied');
        }).finally(() => {
            this.filterLoader[index] = false;
        });

    }

    onFilterListUpdated() {
        this.getCardFilters().forEach(filterModel => {
            this.updateFilterFormModelOnFilterSaved(filterModel);
        });
    }

    updateFilterFormModelOnFilterSaved(filterModel) {
        let item = this.filters.find(item => {
            let condition = item.operator.value === filterModel.operator && item.column.id === filterModel.column.id;
            
            if (filterModel.column.isDate && !filterModel.isRange) {
                return condition && filterModel.firstValue === this.dateAsString(item.firstValue);
            } else {
                return condition && _.isEqual(filterModel.values, item.values);
            }
        });

        if (item) {
            item.chainLetter = filterModel.chainLetter;
            let index = _.findIndex(this.filters, item);
            this.filters.splice(index, 1, item);
        }
    }

    dateAsString(date) {
        return moment(date).format(Config.dateFormats.grails);
    }

    applyFilterRules() {
        this.filtersRuleSubmitted = true;
        if (this.filtersRuleForm.$invalid) return;

        var promise = this.card.filters.setRules(this.filtersRule, this.metric);

        if (this.card.metrics.error) return;

        this.filtersRuleLoading = true;

        return promise
            .then(() => this.toaster.success('Filter rules successfully applied'))
            .finally(() => this.filtersRuleLoading = false);
    }

    isAdded(index) {
        /** @type {FilterFormModel} **/
        const filter = this.filters[index];
        return filter.id || (filter.cardFilter || filter.metricFilter || {}).dataSetId;
    }

    isSelectedOperatorEqualsInOrNotIn(operator) {
        return operator ? OPERATORS_ALLOWED_FOR_MULTIPLE_VALUES.indexOf(operator.value) > -1 : false;
    }
    
    onSelectOperator(filter) {
        if(filter.isRange) return;
        
        filter.values = [];
    }

    isMultiSelect(filter) {
        return !filter.column.isDate && this.isSelectedOperatorEqualsInOrNotIn(filter.operator) && this.filterValuesAreVisible(filter);
    }

    isSingleSelect(filter) {
        return !filter.column.isDate && !this.isSelectedOperatorEqualsInOrNotIn(filter.operator) && this.filterValuesAreVisible(filter);
    }
    
    shouldBeConvertedToDateObject(filter) {
        return filter.column.isDate && !filter.isNullLike() && !filter.isRange && !filter.isBetween();
    }
}

truedashApp.component('appCardBuilderFilters', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: CardBuilderFiltersCtrl,
    templateUrl: 'content/builder/filters/cardBuilderFilters.html'
});
