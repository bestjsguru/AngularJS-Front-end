'use strict';

import './metricData/metricData.component';
import './columnData/columnData.component';
import './derivedTable/derivedTable.component';
import './metricPreview/metricPreview.component';
import './affectedCards/affectedCards.component';
import './metricFilters/metricFilters.component';

class InsightCtrl {
    constructor(MetricService, DataSourceService, $state, $q, MetricDataService, $uibModal, DeregisterService, $rootScope,
                $scope, $confirm, toaster, $filter, MetricCacheHelperService, ColumnCacheHelperService, DataProvider, AppEventsService) {
        this.$rootScope = $rootScope;
        this.MetricService = MetricService;
        this.DataSourceService = DataSourceService;
        this.AppEventsService = AppEventsService;
        this.MetricCollection = MetricService.createCollection();
        this.$state = $state;
        this.$q = $q;
        this.MetricDataService = MetricDataService;
        this.$uibModal = $uibModal;
        this.watchers = DeregisterService.create($scope);
        this.$confirm = $confirm;
        this.toaster = toaster;
        this.$filter = $filter;
        this.DataProvider = DataProvider;
        this.ColumnCacheHelperService = ColumnCacheHelperService;
        this.MetricCacheHelperService = MetricCacheHelperService;
        
        this.loading = false;
        this.source = {};
        this.metrics = [];
        this.allMetrics = [];
        this.data = [];
        this.tables = {loading: true, items: []};

        this.init().then(() => {
            this.statuses = [
                {
                    label: 'Metrics',
                    name: 'metric',
                    checked: false,
                },
                {
                    label: 'Columns',
                    name: 'column',
                    checked: false,
                }
            ];
        });
        
        this.watchers.onRoot('insight.metricUpdated', () => this.initMetrics(false));
        this.watchers.onRoot('insight.metricCreated', () => this.initMetrics(false));
        this.watchers.onRoot('insight.tableCreated insight.tableUpdated', () => {
            this.initTables().then(() => this.initMetrics());
        });
        this.watchers.onRoot('insight.columnUpdated', () => {
            this.tables.items.forEach(table => {
                // Initiate metric columns if we expand table accordion
                table.isOpen && table.items.filter(item => item.type === 'metric').forEach(item => {
                    this.initMetricColumns(item.value);
                });
            });
        });
    }
    
    init(useCache = true) {
        this.loading = true;
        
        return this.initDataSource(useCache).then(() => {
            this.tables.loading = true;
            this.tables.items = [];
    
            this.AppEventsService.track('insight-page', {id: this.source.id});
            
            return this.initTables(useCache);
        }).then(() => {
            return this.initMetrics(useCache);
        }).catch(() => {
            this.toaster.error('Error loading feed info');
        }).finally(() => {
            this.loading = false;
            this.tables.loading = false;
        });
    }
    
    setCodemirrorTables(){
        this.codemirrorConfig.setTables(this.tables.items.map(table => ({ text: table.name })).sort((a, b) => {
            if(a.text < b.text) return 1;
            if(a.text > b.text) return -1;
            return 0;
        }));
    }
    
    initDataSource(useCache = true) {
        return this.DataSourceService.getInfo(this.$state.params.sourceId, useCache).then((source) => {
            this.source = source;
            
            return this.source;
        });
    }
    
    initTables(useCache = true) {
        return this.MetricDataService.loadTablesBySource(this.source.id, useCache).then((tables) => {
            tables.forEach(table => {
                table.isOpen = (this.tables.items.find(item => item.id === table.id) || {}).isOpen;
            });
    
            this.tables.loading = false;
            this.tables.items = tables;
            
            this.tables.items.forEach(table => {
                table.columns.sort((a, b) => a.id - b.id);
            });
            
            this.initTableSorting();
            
            this.initTableColumns();
        });
    }
    
    initMetrics(useCache = true) {
        return this.MetricService.getByDataSource(this.source.id, useCache).then((metrics) => {
            this.allMetrics = metrics.filter(metric => !metric.isSQLBased());
            this.metrics = this.allMetrics;
            
            this.metrics.forEach(metric => {
                if(!this.data[metric.getId()]) this.data[metric.getId()] = {
                    availableColumns: {loading: false, items: []},
                    dateColumns: {loading: false, items: []},
                };
        
                let tableId = metric.table || null;
                this.data[metric.getId()].table = this.tables.items.find(item => item.id === tableId);
            });
    
            this.initTableMetrics();
        });
    }
    
    initMetricColumns(metric) {
        if(!this.data[metric.getId()] || !this.data[metric.getId()].table) return false;
        
        if(!this.data[metric.getId()]) this.data[metric.getId()] = {
            availableColumns: {loading: false, items: []},
            dateColumns: {loading: false, items: []},
        };
        
        this.data[metric.getId()].availableColumns.loading = true;
        this.data[metric.getId()].availableColumns.items = [];
        this.data[metric.getId()].dateColumns.loading = true;
        this.data[metric.getId()].dateColumns.items = [];
        
        return this.MetricDataService.loadAllTableColumns(this.data[metric.getId()].table.id, metric.getId()).then((columns) => {
            this.data[metric.getId()].availableColumns.loading = false;
            this.data[metric.getId()].dateColumns.loading = false;
            this.data[metric.getId()].availableColumns.items = columns;
            this.data[metric.getId()].dateColumns.items = this.data[metric.getId()].availableColumns.items.filter(column => column.isDate);
    
            let columnId = metric.info ? metric.info.dateColumn : null;
    
            // Because dateColumn can either have columnID or columnName we have to try to search by both values
            // In order to preselect correct column. columnID is usualy sent for dynamicRelation complexity
            this.data[metric.getId()].dateColumn = this.data[metric.getId()].availableColumns.items.find(item => item.id == columnId);
    
            if(!this.data[metric.getId()].dateColumn) {
                this.data[metric.getId()].dateColumn = this.data[metric.getId()].availableColumns.items.find(item => item.name == columnId);
            }
        });
    }
    
    initTableColumns() {
        this.tables.items = this.tables.items.map(table => {
            if(!table.items) table.items = [];
            table.items = table.items.filter(item => item.type === 'metric');
    
            table.items = [...table.items, ...table.columns.map(item => ({
                type: 'column',
                name: item.name,
                displayName: item.displayName,
                isDimension: item.isDimension,
                value: item,
            }))];
    
            this.orderTableItems(table);
            
            return table;
        });
    }
    
    initTableMetrics() {
        
        this.tables.items = this.tables.items.map(table => {
            if(!table.items) table.items = [];
            table.items = table.items.filter(item => item.type === 'column');
            
            table.metrics = this.getTableMetrics(table);
            table.items = [...table.metrics.map(item => ({
                type: 'metric',
                name: item.label,
                active: item.active,
                value: item,
            })), ...table.items];
    
            this.orderTableItems(table);
            
            return table;
        });
    }
    
    getTableMetrics(table) {
        return this.metrics.filter(metric => {
            return this.data.reduce((ids, data, metricId) => {
                if(data.table && data.table.id === table.id) ids.push(metricId);
                
                return ids;
            }, []).includes(metric.getId());
        });
    }
    
    createTable() {
        this.$uibModal.open({
            size: 'md',
            component: 'appDerivedTable',
            resolve: {
                source: () => this.source,
            }
        });
    }
    
    edit($event, table) {
        $event.stopPropagation();
        $event.preventDefault();
        
        this.$uibModal.open({
            size: 'md',
            component: 'appDerivedTable',
            resolve: {
                table: () => table,
                source: () => this.source,
            }
        });
    }
    
    createMetric($event, table) {
        $event.stopPropagation();
        $event.preventDefault();
        
        this.$uibModal.open({
            size: 'md',
            component: 'appMetricData',
            resolve: {
                item: () => null,
                table: () => table,
                source: () => this.source,
                tables: () => this.tables,
            }
        });
    }
    
    editMetric(item, table) {
        this.$uibModal.open({
            size: 'md',
            component: 'appMetricData',
            resolve: {
                item: () => item,
                table: () => table,
                source: () => this.source,
                tables: () => this.tables,
            }
        });
    }
    
    editColumn(item) {
        this.$uibModal.open({
            size: 'md',
            component: 'appColumnData',
            resolve: {
                item: () => item,
                source: () => this.source,
            }
        });
    }
    
    preview(item) {
        this.$uibModal.open({
            size: 'md',
            component: 'appMetricPreview',
            resolve: {
                metric: () => item.value,
            }
        });
    }
    
    filters(item) {
        this.$uibModal.open({
            size: 'lg',
            component: 'appMetricFilters',
            resolve: {
                metric: () => item.value,
            }
        });
    }
    
    deleteMetric(metric) {
        this.$confirm({text: 'Are you sure you want to delete this metric? This action cannot be undone.'}).then(() => {
            return this.MetricService.delete(metric).then(() => {
                this.toaster.success('Metric deleted');
                
                // Remove deleted metric immediately
                this.tables.items = this.tables.items.map(table => {
                    if(!table.items) table.items = [];
                    table.items = table.items.filter(item => item.value.id !== metric.id);
        
                    return table;
                });
    
                this.MetricCacheHelperService.removeFromDataSource(metric, this.source.id);
                
                this.initMetrics();
            }).catch(error => this.toaster.error(error.message));
        });
    }
    
    cloneMetric(item, table) {
        item.loading = true;
        
        this.MetricService.clone(item.value.id).then(response => {
            this.MetricCacheHelperService.addToDataSource(response, this.source.id);
    
            this.initMetrics().then(() => {
                this.highlightMetric(response.id);
                
                // Initiate metric columns if we expand table accordion
                table.items.filter(item => item.type === 'metric').forEach(item => {
                    this.initMetricColumns(item.value);
                });
            });
        }).catch(error => {
            item.loading = false;
            this.toaster.error(error.message);
        });
    }
    
    toggleMetricVisibility(item) {
        item.loading = true;
        
        this.MetricService.toggle(item.value).then(response => {
            this.MetricCacheHelperService.updateInDataSource(response, this.source.id);
            
            item.active = !item.active;
        }).catch(error => {
            this.toaster.error(error.message);
        }).finally(() => {
            item.loading = false;
        });
    }
    
    highlightMetric(id) {
        this.tables.items.forEach((table) => {
            let newMetric = table.items.find(item => {
                return item.type === 'metric' && item.value.id === id;
            });
    
            if(newMetric) {
                newMetric.highlight = true;
                
                // We need to setup timeout that will disable highlighting after animation is completed.
                // Otherwise metric will stay highlighted every time we expand table accordion.
                this.watchers.timeout(() => {
                   newMetric.highlight = false;
                }, 1500);
            }
        });
    }
    
    initTableSorting() {
        this.sorting = [];
        
        this.tables.items.forEach((table) => {
            this.sorting[table.id] = {orderColumn: null, reverse: null};
        });
    }
    
    orderBy(column, table) {
        this.sorting[table.id].orderColumn = column;
        this.sorting[table.id].reverse = !this.sorting[table.id].reverse;
        
        this.orderTableItems(table);
    }
    
    orderTableItems(table) {
        if(this.sorting[table.id] && this.sorting[table.id].orderColumn) {
            table.items = this.$filter('orderBy')(table.items, this.sorting[table.id].orderColumn, this.sorting[table.id].reverse);
        }
    }
    
    orderedBy(column, table) {
        return this.sorting[table.id].orderColumn === column;
    }
    
    isReverse(table) {
        return this.sorting[table.id].reverse;
    }
    
    toggle(table) {
        let status = !table.isOpen;
        
        table.isOpen = status;
        
        if(table.isOpen) {
            // Initiate metric columns if we expand table accordion
            table.items.filter(item => item.type === 'metric').forEach(item => {
                this.initMetricColumns(item.value);
            });
        }
    }
    
    collapse() {
        // Cancel all timeouts
        this.watchers.cancelTimeout();
        this.tables.items.forEach(table => table.isOpen = false);
    }
    
    toggleAllTables() {
        let shouldOpen = this.allTablesCollapsed() ? true : false;
        
        if(!shouldOpen) return this.collapse();
        
        this.tables.items.forEach((table, index) => {
            
            this.watchers.timeout(() => {
                table.isOpen = true;
                
                // Initiate metric columns if we expand table accordion
                table.items.filter(item => item.type === 'metric').forEach(item => {
                    this.initMetricColumns(item.value);
                });
            }, 10 * index);
        });
    }
    
    allTablesCollapsed() {
        return this.tables.items.filter(table => table.isOpen && !table.hidden).length === 0;
    }
    
    countTableColumns(table) {
        return table.items.filter(item => item.type === 'column' && !item.hidden).length;
    }
    
    countTableMetrics(table) {
        return table.items.filter(item => item.type === 'metric' && !item.hidden).length;
    }
    
    clear() {
        this.query = '';
        
        this.watchers.timeout(() => this.filter(), 50);
    }
    
    filterByStatus(status) {
        status.checked = !status.checked;
        
        this.filter();
    }
    
    filter() {
        let query = _.clone(this.query) || '';
        let selectedStatuses = this.statuses.filter(status => status.checked);
        
        let openStatus = this.tables.items.reduce((statuses, table) => {
            statuses[table.id] = table.isOpen;

            return statuses;
        }, []);
    
        this.tables.items = this.tables.items.map(table => {
            this.showAllTableItems(table);
            
            if(selectedStatuses.length) {
                table.isOpen = openStatus[table.id];
            
                table.items = table.items.map(item => {
                    item.hidden = !selectedStatuses.find(status => status.name === item.type);
                    
                    return item;
                });
            }
        
            return table;
        }).map(table => {
            table.hidden = table.items.filter(item => !item.hidden).length === 0;
    
            return table;
        });
        
        if(query.length >= 2) {
            this.tables.items = this.tables.items.map(table => {
                if(table.hidden) return table;
                
                table.isOpen = openStatus[table.id];
                
                if(!this.compareWithSearchQuery(table.name)) {
                    table.items = table.items.map(item => {
                        if(item.hidden) return item;
                        
                        item.hidden = !(this.compareWithSearchQuery(item.displayName) || this.compareWithSearchQuery(item.name));
                        
                        return item;
                    });
                }
        
                return table;
            }).map(table => {
                table.hidden = table.items.filter(item => !item.hidden).length === 0;
                
                return table;
            });
        }
    }
    
    compareWithSearchQuery(value) {
        let query = (this.query || '').replaceAll(['.', '_'], ' ').toLowerCase();
        
        return (value || '').replaceAll(['.', '_'], ' ').toLowerCase().includes(query);
    }
    
    getSelectedColumns(table) {
        return table.items.filter(item => item.type === 'column' && item.selected);
    }
    
    toggleColumnSelect(column, table) {
        if(!column) {
            let newStatus = !this.allColumnsSelected(table);
            
            table.items = table.items.map(item => {
                item.selected = newStatus;
                
                return item;
            });
            
            return;
        }
        
        column.selected = !column.selected;
    }
    
    allColumnsSelected(table) {
        return table.items.filter(item => !item.selected).length === 0;
    }
    
    showAllTableItems(table) {
        table.items = table.items.map(item => {
            item.hidden = false;
        
            return item;
        });
    }
    
    toggleColumnsAvailableStatus($event, isAvailable, table) {
        $event.stopPropagation();
        $event.preventDefault();
        
        table.loading = true;
        
        let columns = table.items.filter(item => item.selected).map(item => item.value);
        
        this.MetricDataService.toggleColumnsAvailableStatus(isAvailable, columns, table).then(() => {
    
            table.items.forEach(item => {
                if(item.selected) {
                    item.isDimension = isAvailable;
                    item.value.isDimension = isAvailable;
                }
            });
            
            this.ColumnCacheHelperService.updateColumns(table.items.filter(item => item.selected).map(item => item.value), this.source.id);
            this.DataProvider.clearUrlCache('card/availableColumns', 'GET');
            this.DataProvider.clearUrlCache('table/columnsByTableRelation', 'GET');
    
            this.$rootScope.$broadcast('insight.columnUpdated');
        }).finally(() => {
            table.loading = false;
            
            // Unselect selected columns on success
            table.items.forEach(item => item.selected = false);
        });
    }
    
    getMetricType(metric) {
        return _.get(metric.getFormattingInfo(), 'type', '').capitalizeFirstLetter();
    }
    
    getMetricSymbol(metric) {
        return _.get(metric.getFormattingInfo(), 'symbol', '');
    }
}

truedashApp.component('appInsight', {
    controller: InsightCtrl,
    templateUrl: 'content/dataset/insight/insight.html'
});

