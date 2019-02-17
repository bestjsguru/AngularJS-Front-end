'use strict';

import {Collection} from '../../data/collection';
import {FilterDTO} from './dto/FilterDTO';

class MetricFilters extends Collection {
    constructor(metric, $q, FilterModel, MetricDataService) {
        super();
        this.metric = metric;
        /** @type {MetricDataService} **/
        this.MetricData = MetricDataService;
        this.FilterModel = FilterModel;
        this.$q = $q;
    }
    
    init() {
        if(!this.metric.rawId) {
            return this.$q.reject('Metric not saved');
        }
        
        return this.$q.all([this.initFilters(), this.getRules()]);
    }
    
    initFilters() {
        return this.MetricData.getFilters(this.metric.rawId)
            .then(filters => this.processServerData(filters));
    }
    
    /** @private */
    processServerData(filters) {
        this.clear();
        filters = filters || [];
        
        filters.reverse().forEach(filter => this.addItem(filter));
    }
    
    loadAvailableColumns(useCache = true) {
        return this.MetricData.loadAvailableColumns(this.metric.rawId, useCache);
    }
    
    add(params) {
        if(params instanceof FilterDTO) {
            params = _.clone(params);
        }
        
        // check this code if there will be an issue like "A AND A AND B" with metric rules
        this.rules += !this.rules ? params.chainLetter : ' AND ' + params.chainLetter;
        var filterResponse;
        return this.MetricData.addFilter(params)
            .then(response => {
                filterResponse = response;
                this.MetricData.invalidateFilters(this.metric.rawId);
                this.MetricData.invalidateAffectedCard(this.metric.rawId);
                
            })
            .then(() => this.setRules(this.rules))
            .then(response => this.addItem(new this.FilterModel(filterResponse)));
    }
    
    update(params) {
        return this.MetricData.updateFilter(params)
            .then(() => {
                this.MetricData.invalidateFilters(this.metric.rawId);
                this.MetricData.invalidateAffectedCard(this.metric.rawId);
            });
    }
    
    remove(filter) {
        var idx = this.items.indexOf(filter);
        if(idx == -1) return this.$q.reject('No filter found');
        
        return this.MetricData.deleteFilter(filter.id)
            .then(() => {
                this.MetricData.invalidateFilters(this.metric.rawId);
                this.MetricData.invalidateAffectedCard(this.metric.rawId);
            })
            .then(() => {
                this.removeByIdx(idx);
                this.removeFilterRule(filter.chainLetter);
            })
            .then(() => this.setRules(this.rules));
    }
    
    removeFilterRule(letter) {
        this.rules = this.rules.replace(new RegExp(`AND ${letter}`, 'gi'), '');
        this.rules = this.rules.replace(new RegExp(`OR ${letter}`, 'gi'), '');
        this.rules = this.rules.replace(new RegExp(`${letter} AND `, 'gi'), '');
        this.rules = this.rules.replace(new RegExp(`${letter} OR `, 'gi'), '');
        this.rules = this.rules.replace(new RegExp(`\b${letter}\b`, 'gi'), '');
        this.rules = this.rules.replace(/\((.)\)/g, '$1');
        this.rules = this.rules.replace(new RegExp(`^${letter}$`, 'gi'), '');
        this.rules = this.rules.replace(/\s\s+/g, ' ');
        
        this.rules = this.rules.trim();
    }
    
    setRules(rules) {
        return this.MetricData.setFilterRules(rules, this.metric.rawId)
            .then(() => {
                this.MetricData.invalidateFilterRule(this.metric.rawId);
                this.MetricData.invalidateAffectedCard(this.metric.rawId);
            })
            .then(() => this.rules = rules);
    }
    
    getRules() {
        return this.MetricData.getFilterRules(this.metric.rawId)
            .then(rules => rules == 'null' ? this.rules = '' : this.rules = rules);
    }
    
    getJson() {
        return this.map(filter => filter.getJson());
    }
}

truedashApp.factory('MetricFiltersFactory', ($q, FilterModel, MetricDataService) => ({
    /**
     * @param metric
     * @return {MetricFilters}
     */
    create: (metric) => new MetricFilters(metric, $q, FilterModel, MetricDataService)
}));
