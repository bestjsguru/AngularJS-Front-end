'use strict';

import './dexiTable.service';
import {Helpers} from '../../../common/helpers';

const RESULTS_LIMIT = 500;

class DexiTableCtrl {
    constructor($scope, $confirm, datatableTransformerFactory, DeregisterService, DexiTableService) {
        this.$confirm = $confirm;
        this.DexiTableService = DexiTableService;
        this.datatableTransformerFactory = datatableTransformerFactory;
        
        this.watchers = DeregisterService.create($scope);
        this.loading = false;
        this.message = '';
    }
    
    $onInit() {
        this.total = 0;
        this.pageSize = RESULTS_LIMIT;
        this.currentPageSize = RESULTS_LIMIT;
        
        this.initCard();
    }
    
    get max() {
        return Math.min(this.total, RESULTS_LIMIT);
    }
    
    initCard() {
        this.card = null;
        
        return this.watchers.timeout(() => {
            this.card = this.originalCard.clone();
            this.withDashboardFilters = !!this.originalCard.cardUpdateModel;
    
            return this.loadData();
        }, 100);
    }
    
    loadData() {
        // this.card.types.setState({type: null, subType: null});
        
        return this.card.metrics.loadData(false, this.withDashboardFilters, this.pageSize).then(() => {
            if(!this.isError()) {
                this.datatableTransformer = this.datatableTransformerFactory.transform(this.card, false);
    
                this.total = this.card.metrics.originalData.rowCount;
                this.pageSize = this.card.metrics.originalData.total;
                this.columns = this.getColumns();
                this.results = this.getResults();
    
                this.currentPageSize = _.clone(this.pageSize);
            }
        }).catch(() => {
            this.pageSize = _.clone(this.currentPageSize);
        });
    }
    
    reload() {
        console.log(this.pageSize);
        
        if(!this.pageSize) return;
        
        if(!this.hasCustomValues()) {
            return this.loadData();
        }
        
        this.$confirm({
            title: 'Reload data ',
            text: `If you reload the data your custom values will be lost. <br> Are you sure you want to do this?`,
            ok: 'Yes',
            cancel: `Cancel`
        }).then(() => {
            return this.loadData();
        }).catch(() => {
            this.pageSize = _.clone(this.currentPageSize);
        });
    }
    
    hasCustomValues() {
        return this.results && this.results.some(row => {
            return row.some(value => value.isCustom);
        });
    }
    
    getColumns() {
        let columns = _.cloneDeep(this.datatableTransformer.metricData.columns);
        
        return columns.map(column => {
            return {
                name: column,
                isMetric: !!this.getMetric(column),
            };
        });
    }
    
    getResults() {
        let results = _.cloneDeep(this.datatableTransformer.metricData.results);
        
        return results.map((row, rowIndex) => {
            return row.map((value, index) => {
                let isDate = this.isDateColumn(index);
                
                return {
                    value: String(value),
                    original: String(value),
                    date: isDate ? this.card.metrics.originalData.results[rowIndex][index] : false,
                    get isCustom() {
                        return this.value !== this.original;
                    }
                }
            });
        });
    }
    
    getMetric(name) {
        
        let metric = this.card.metrics.find(metric => metric.name === name);
        
        if (!metric && this.card.formulas.length > 0) {
            let formula = this.card.formulas.find(formula => formula.data.name.toLowerCase() === String(name).toLowerCase());
            // for card with frequency total and formulas
            metric = formula ? formula.data : null;
        }
        
        return metric;
    }
    
    reset(item) {
        item.value = item.original;
    }
    
    process() {
        if(!this.link) return;
        
        this.loading = true;
        
        this.message = '';
        
        let params = {
            card: this.card.id,
            hookId: this.link.id,
            columns: this.columns,
            results: this.results.map(row => {
                return row.map((value, index) => {
                    if(this.columns[index].isMetric) {
                        value.value = Helpers.toNumber(value.value);
                        value.original = Helpers.toNumber(value.original);
                    }
                    
                    return value;
                });
            }),
        };
        
        return this.DexiTableService.process(params).then(response => {
            if(response.success) {
                this.message = response.success;
            }
        }).finally(() => {
            this.loading = false;
        });
    }
    
    isDateColumn(index) {
        return this.datatableTransformer.metricData.columns[index] === 'Date';
    }
    
    isError() {
        return this.card && this.card.metrics.error;
    }
}

truedashApp.component('appDexiTable', {
    controller: DexiTableCtrl,
    templateUrl: 'content/card/dexi/table/dexiTable.html',
    bindings: {
        link: '=',
        originalCard: '<',
    }
});
