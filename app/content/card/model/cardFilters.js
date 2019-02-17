'use strict';

import './columnEntity.model.js';
import './filter.model.js';
import {Collection} from '../../data/collection';

class CardFilters extends Collection {
    constructor(card, $q, FilterModel, MetricDataService, AppEventsService) {
        super();
        this.card = card;
        /** @type {FilterModel} **/
        this.FilterModel = FilterModel;
        this.AppEventsService = AppEventsService;
        this.MetricData = MetricDataService;
        this.$q = $q;
    }

    init(data) {
        this.processServerData(data.filters);
    }

    /** @private */
    processServerData(filters) {
        this.clear();
        filters = filters || [];

        filters.forEach((filter, index) => filter.cardMetricRelationId && this.addItem(new this.FilterModel(filter)));
    }

    loadAvailableColumnsForMetric(metricId) {
        return this.MetricData.loadAvailableColumns(metricId);
    }

    add(params, dataSet) {
        var filter = this.addItem(new this.FilterModel(params));

        this.AppEventsService.track('created-card-filter');

        return filter;
    }

    /**
     * @param  data
     * @param {FilterModel} filter
     * @returns {*}
     */
    update(data, filter) {
        var idx = this.items.indexOf(filter);
        
        if (idx == -1) return this.$q.reject('No filter found');
        filter.update(data);

        this.AppEventsService.track('updated-card-filter');

        return filter;
    }

    remove(filter) {
        var idx = this.items.indexOf(filter);
        if (idx == -1) return this.$q.reject('No filter found');

        this.removeByIdx(idx);
        var dataSet = this.card.metrics.getDataSetById(filter.dataSetId);
        this.removeFilterRule(filter.chainLetter, dataSet);
        this.updateLetters(dataSet);

        this.AppEventsService.track('deleted-card-filter');

        return this.card.metrics.loadData();
    }

    updateLetters(dataSet) {
        var letterMap = {};
        var filters = this.getByDataSet(dataSet);
        var letter = 'A';
        filters.forEach(filter => {
            letterMap[filter.chainLetter] = letter;
            filter.chainLetter = letter;
            letter = String.fromCharCode(letter.charCodeAt(0)+1);
        });

        var items = dataSet.filtersRule.split(' ');

        items = items.map((item) => {
            if (item in letterMap){
                return letterMap[item];
            }

            return item;
        });

        dataSet.filtersRule = items.join(' ');
    }

    removeByDataSet(dataSet) {
        for (var i = this.length - 1; i >= 0; i--) {
            var filter = this.items[i];
            if (filter.dataSetId === dataSet.virtualId) {
                this.removeItem(filter);
            }
        }
    }

    removeFilterRule(letter, dataSet) {
        var filtersRule = dataSet.filtersRule;

        filtersRule = filtersRule.replace(new RegExp(`AND ${letter}`,'g'), '');
        filtersRule = filtersRule.replace(new RegExp(`OR ${letter}`,'g'), '');
        filtersRule = filtersRule.replace(new RegExp(`${letter} AND `,'g'), '');
        filtersRule = filtersRule.replace(new RegExp(`${letter} OR `,'g'), '');
        filtersRule = filtersRule.replace(new RegExp(`\b${letter}\b`,'g'), '');
        filtersRule = filtersRule.replace(/\((.)\)/g, '$1');
        filtersRule = filtersRule.replace(new RegExp(`^${letter}$`,'g'), '');
        filtersRule = filtersRule.replace(/\s\s+/g, ' ');

        dataSet.filtersRule = filtersRule.trim();
    }

    setRules(rule, dataSet) {
        dataSet.filtersRule = rule;
        return this.card.metrics.loadData();
    }

    getByDataSet(dataSet) {
        return _.sortBy(this.filter(filter => filter.dataSetId == dataSet.virtualId), filter => filter.chainLetter);
    }

    getJson() {
        return this.map(filter => filter.getJson());
    }

    getState() {
        return {
            items: this.map(filter => filter.clone())
        };
    }

    setState(state) {
        this.items = state.items;
    }
}


truedashApp.factory('CardFiltersFactory', ($q, FilterModel, MetricDataService, AppEventsService) => ({
    create: (card) => new CardFilters(card, $q, FilterModel, MetricDataService, AppEventsService)
}));
