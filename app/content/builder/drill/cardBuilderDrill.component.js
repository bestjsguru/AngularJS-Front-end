'use strict';

import {Config} from '../../config.js';
import DrillLevel from './drillLevel';

class CardBuilderDrillController {

    /**
     * @param {DeregisterService} DeregisterService
     */
    constructor($q, $scope, toaster, DeregisterService) {
        this.$q = $q;
        this.$scope = $scope;
        this.toaster = toaster;
        this.DeregisterService = DeregisterService;

        this.watchers = DeregisterService.create(this.$scope);

        this.drills = [];
        this.columns = [];
        this.allColumns = [];
        this.loading = false;
    }

    $onInit() {
        this.card = this.cardBuilder.card;

        this.chartTypes = Config.drillMap.chartTypes;
        this.operations = [{ type: 'groupby', label: 'Group By'}];

        if (this.card.metrics.length <= 1) {
            this.operations.push({ type: 'grain', label: 'Grain'});
        }
    
        this.watchers.onRoot('cardBuilderMetrics.removedMetric', () => this.load());
    
        this.card.metrics.on('added', this.load, this);

        this.load();
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }

    addExisting(level = {}) {
        level.added = true;
        this.drills.push(new DrillLevel(level));
    }

    addNew(level = {}) {
        level.operation = this.operations[0];
        level.chartType = this.chartTypes[0];
        this.drills.push(new DrillLevel(level));
    }

    load() {
    
        this.drills = [];
        this.loading = true;

        this.$q.all([this.loadCommonColumns(), this.card.drill.cardDrillMap]).then(([columns, drillMap]) => {
            return {
                columns,
                drillMap: angular.copy(drillMap)
            };
        }).then(res => {
            if(res.drillMap) {
                res.drillMap.levels.forEach(level => this.addExisting(level));
            }
            this.columns = res.columns;
            this.allColumns = res.columns;
        }).finally(() => {
            this.removeUsedColumns();
            this.loading = false;
        });
    }
    
    loadCommonColumns() {
        const metricIds = this.card.metrics.filter(m => m.isRegular()).map(m => m.rawId);
        return this.$q.all(
            metricIds.map(metricId => this.card.filters.loadAvailableColumnsForMetric(metricId))
        ).then(columnsFromAllMetrics => {
            const arrays = columnsFromAllMetrics.sort((a, b) => a.length - b.length);
    
            return arrays.shift().reduce((res, column) => {
                let alreadyAdded = res.find(item => item.name === column.name);
                let isCommon = arrays.every((list) => list.find(item => item.name === column.name));
                
                if(!alreadyAdded && isCommon && !column.isDate) {
                    res.push(column);
                }
                
                return res;
            }, []);
            
        }).catch(() => {
            this.toaster.error(`Something went wrong while trying to retrieve available columns for metric(s) with id(s): ${metricIds.join(', ')}`);
        });
    }

    removeUsedColumns() {
        this.columns = this.allColumns.slice();
        
        if(!this.card.drill.cardDrillMap) return;

        let usedColumns = this.card.drill.cardDrillMap.levels.reduce((columns, level) => {
            level.column && columns.push(level.column.name);
            return columns;
        }, []);

        this.columns = this.allColumns.filter(column => {
            return !usedColumns.includes(column.name);
        });

        this.drills.map(drill => {
            if(!drill.added && drill.column && usedColumns.includes(drill.column.name)){
                drill.column = undefined;
            }

            return drill;
        });
    }

    add(index) {
        let form = this.forms['drill_' + index + '_form'];
        form.$setSubmitted();

        if (this.loading || form.$invalid) return;
        let params = {
            chartType: this.drills[index].chartType.type,
            operation: this.drills[index].operation.type
        };

        if (this.drills[index].operation.type == 'groupby') {
            params.column = this.drills[index].column;
        }

        if(this.card.drill.addLevel(params)) {
            this.drills[index].added = true;
            this.drills[index].chartType = this.drills[index].chartType.type;
            this.drills[index].operation = this.drills[index].operation.type;
            this.removeUsedColumns();
        }

    }

    remove(index) {
        this.drills[index].added && this.card.drill.removeLevel(index);
        this.drills.splice(index, 1);
        this.removeUsedColumns();
    }

    canAddLevel() {
        return this.drills.length === 0 || this.drills[this.drills.length - 1].operation != 'grain';
    }

    onOperationSelect(index) {
        if (this.drills[index].operation.type == 'grain') this.drills[index].chartType = this.chartTypes.find(type => type.type == 'table');
    }

    isEntryDisabled(entry) {
        return entry.operation == 'grain' && this.card.metrics.length > 1;
    }


}

truedashApp.component('appCardBuilderDrill', {
    controller: CardBuilderDrillController,
    templateUrl: 'content/builder/drill/cardBuilderDrill.html',
    require: {
        cardBuilder: '^appBuilder'
    }
});

