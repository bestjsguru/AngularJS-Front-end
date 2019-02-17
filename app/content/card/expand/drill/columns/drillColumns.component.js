'use strict';

import DrillContextMenu from '../drillContextMenu';

class DrillColumnsCtrl extends DrillContextMenu {
    constructor($scope, $element, $document, $filter, DeregisterService) {
        super('.drill-columns');
        
        this.$filter = $filter;
        this.$element = $element;
        this.$document = $document;
        this.watchers = DeregisterService.create($scope);
    
        this.query = '';
        this.columns = [];
        this.loading = false;
    }

    $onInit() {
        this.card.drill.on('showColumns', this.showColumns, this);
        this.card.drill.on('presetDrill', this.presetDrill, this);
        
        this.closeOnClick();
    }
    
    customDrill(column) {
        this.card.drill.presets.deactivate();
        
        this.drill(column);
    }
    
    presetDrill(params, column) {
        this.columns = [];
        this.params = params;
        this.position = params.position;
        this.value = params.value;
        this.groupings = params.groupings;
        this.metric = this.getMetric(params.metric);
        this.type = this.card.types.isMixed() ? this.card.chartSettings.metricChartType(params.metric.id) : this.card.types.subType;
        
        if(this.metric) {
            this.removeMetricNameFromValue();
            
            let metric = this.metric;
            
            if(this.metric.isComparable()) {
                metric = this.card.compare.getRelatedMetric(this.metric);
            }
            
            if(metric) {
                this.drill(column);
            }
        }
    }
    
    showColumns(params) {
        this.show();
    
        this.columns = [];
        this.params = params;
        this.position = params.position;
        this.value = params.value;
        this.groupings = params.groupings;
        this.metric = this.getMetric(params.metric);
        this.type = this.card.types.isMixed() ? this.card.chartSettings.metricChartType(params.metric.id) : this.card.types.subType;
    
        if(this.metric) {
            this.removeMetricNameFromValue();
    
            let metric = this.metric;
    
            if(this.metric.isComparable()) {
                metric = this.card.compare.getRelatedMetric(this.metric);
            }
    
            if(metric) {
                this.loadAvailableColumns(metric);
                this.fitToScreen();
            }
        }
    }
    
    filter() {
        this.saveCollapsedState();
        
        this.columns = this.$filter('searchByProperties')(this.allColumns, 'getLabel,tableName', this.query);
        
        this.tables = this.groupColumnsByTable(this.columns);
        this.query.length && this.tables.forEach(table => table.collapsed = false);
        
        this.applyCollapsedState();
    }
    
    saveCollapsedState() {
        if(this.query.length && !this.collapsedState) {
            this.collapsedState = _.cloneDeep(this.tables);
        }
    }
    
    applyCollapsedState() {
        if(!this.query.length && this.collapsedState) {
            this.tables.map(table => {
                this.collapsedState.forEach(state => {
                    if(table.name === state.name) table.collapsed = state.collapsed;
                });
            });
            
            this.collapsedState = null;
        }
    }
    
    loadAvailableColumns(metric) {
        if(!this.card || !metric) return false;
        
        this.loading = true;
        return this.card.filters.loadAvailableColumnsForMetric(metric.rawId).then(columns => {
            // Sort columns by name
            columns.sort((a, b) => {
                let positionA = this.card.drill.columnPosition(a) || Number.MAX_VALUE;
                let positionB = this.card.drill.columnPosition(b) || Number.MAX_VALUE;
                
                if (positionA === positionB) {
                    return a.getLabel().localeCompare(b.getLabel());
                }
                
                return positionA - positionB;
            });
    
            this.allColumns = _.cloneDeep(columns);
            this.allTables = this.groupColumnsByTable(this.allColumns);
            
            this.filter();
            this.fitToScreen();
        }).finally(() => {
            this.loading = false;
        });
    }
    
    groupColumnsByTable(columns) {
        let tables = columns.reduce((tables, column) => {
            let table = tables.find(item => item.name === column.tableName);
            
            if(!table) {
                tables.push({
                    name: column.tableName,
                    collapsed: true,
                    columns: [column],
                });
            } else {
                table.columns.push(column);
            }
            
            return tables;
        }, []).sort((a, b) => a.name.localeCompare(b.name));
    
        if(tables.length) {
            tables[0].collapsed = false;
        }
        
        return tables;
    }
    
    getMetric(metric) {
        return this.card.metrics.getDataSetById(metric.id);
    }
    
    drill(column) {
        // Do nothing if card is already grouped by this column
        if(this.card.drill.columnPosition(column)) return;
        
        this.card.autoReload.disable();
    
        // Remove all formulas for now as we are not supporting them
        this.card.formulas.forEach(formula => this.card.formulas.remove(formula));
    
        this.card.metrics.filter(metric => {
            return metric.id !== this.metric.id;
        }).forEach(metric => {
            if(this.metric.isComparable() && this.metric.isComparedTo(metric)) {
                this.card.metrics.hideMetric(metric);
            } else {
                this.card.metrics.removeMetric(metric);
            }
        });
    
        this.card.drill.setType(this.type);
    
        if(!this.card.frequencies.isTotalSelected()) {
            // In this case we know it's a time series chart and that first drill level will be a date
            this.card.drill.drillByDate(this.card.frequencies.getIntervalFromDate(this.value));
        }
    
        this.card.drill.drillDown(column, this.value, this.groupings);
    
        this.hide();
    
        this.card.autoReload.enable();
        
        return this.card.metrics.loadData(true, this.card.drill.withDashboardFilters);
    }
    
    toggleTable(table) {
        table.collapsed = !table.collapsed;
    }
    
    close() {
        this.card.drill.trigger('showDropdown', this.params);
        
        this.hide();
    }
    
    removeMetricNameFromValue() {
        if(_.isString(this.value)) {
            this.value = this.value.replaceAll(this.metric.name + '-', '');
        }
    }
    
    isOriginalGrouping(column) {
        return this.card.groupings.length && this.card.drill.columnPosition(column);
    }
    
    $onDestroy() {
        this.card.drill.off(null, null, this);
    }
}

truedashApp.component('appDrillColumns', {
    controller: DrillColumnsCtrl,
    templateUrl: 'content/card/expand/drill/columns/drillColumns.html',
    bindings: {
        card: '='
    }
});
