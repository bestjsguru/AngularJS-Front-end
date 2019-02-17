'use strict';

import DrillContextMenu from '../../drillContextMenu';

class DrillRecordsColumnsCtrl extends DrillContextMenu {
    constructor($scope, $element, $document, $filter, DeregisterService) {
        super('.drill-records-columns');
        
        this.$filter = $filter;
        this.$element = $element;
        this.$document = $document;
        this.watchers = DeregisterService.create($scope);
    
        this.query = '';
        this.columns = [];
        this.allColumns = [];
        this.loading = false;
    }

    $onInit() {
        this.card.drill.on('showRecordsColumns', this.showRecordsColumns, this);
        
        this.closeOnClick();
    }
    
    showRecordsColumns(params) {
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
    
    drillRecords() {
        this.hide();
        
        this.card.saveState();
    
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
    
        // Reset any user defined column sorting
        this.card.columnSorting.reset();
        
        this.card.types.setState({type: 'table', subType: 'table'});
        this.card.initCardTable();
        
        if(this.value && !this.card.frequencies.isTotalSelected() && !this.card.frequencies.isGrainSelected()) {
            // In this case we know it's a time series chart and that first drill level will be a date
            this.card.drill.drillByDate(this.card.frequencies.getIntervalFromDate(this.value));
        }
        
        this.card.drill.showRecords(this.value, this.groupings, this.selectedColumns());
        
        // Apply selected groupings first
        this.card.columnPosition.init(_.sortBy(this.card.columnPosition.getJson(), (item) => {
            // Metric will always be first
            if(item.type !== 'dimension') return -Number.MAX_SAFE_INTEGER;
            
            // After that we will put date column if drill by date is applied
            if(this.card.drill.date && parseInt(item.id) === parseInt(this.metric.info.dateColumn)) {
                return -(Number.MAX_SAFE_INTEGER - 1);
            }
            
            // And after all that we will apply selected groupings first
            let position = _.reverse(this.groupings.slice()).findIndex(grouping => grouping.column.id === item.id);
    
            return position >= 0 ? position : Number.MAX_SAFE_INTEGER;
        }));
    
        // This has to be done at the end because drillByDate can't work with total or grain frequency
        this.card.frequencies.setState({selected: 'Grain'});
        
        this.card.autoReload.enable();
        
        return this.card.metrics.loadData(false, this.card.drill.withDashboardFilters);
    }
    
    selectedColumns() {
        return this.allColumns.filter(column => column.selected);
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
    
            // Preselect all columns so they will show in raw data table
            columns = columns.map(column => {
                column.selected = true;
                
                return column;
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
    
    toggleTable(table) {
        table.collapsed = !table.collapsed;
    }
    
    toggleColumn(column) {
        column.selected = !column.selected;
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
    
    selectAll() {
        this.tables.forEach(table => {
            table.columns.forEach(column => {
                column.selected = true;
            });
        });
    }
    
    unselectAll() {
        this.tables.forEach(table => {
            table.columns.forEach(column => {
                if(!this.isOriginalGrouping(column)) column.selected = false;
            });
        });
    }
    
    toggleTableColumns(table) {
        let newStatus = true;
        
        if(table.columns.every(column => column.selected)) newStatus = false;
        
        table.columns.forEach(column => {
            column.selected = newStatus;
        });
    }
    
    tableIconClass(table) {
        let selectedCount = table.columns.filter(column => column.selected).length;
        
        return {
            'fa-minus-square-o': selectedCount < table.columns.length && selectedCount > 0,
            'fa-check-square-o': selectedCount === table.columns.length,
            'fa-square-o': selectedCount === 0
        };
    }
    
    columnCount(table) {
        let selectedCount = table.columns.filter(column => column.selected).length;
        
        return `${selectedCount}/${table.columns.length}`;
    }
    
    $onDestroy() {
        this.card.drill.off(null, null, this);
    }
}

truedashApp.component('appDrillRecordsColumns', {
    controller: DrillRecordsColumnsCtrl,
    templateUrl: 'content/card/expand/drill/records/columns/drillRecordsColumns.html',
    bindings: {
        card: '='
    }
});
