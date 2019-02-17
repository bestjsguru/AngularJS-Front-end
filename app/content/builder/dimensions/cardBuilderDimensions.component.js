'use strict';

class CardBuilderController {
    constructor($scope, DeregisterService, $rootScope, $q, toaster, $filter) {
        this.$scope = $scope;
        this.$filter = $filter;
        this.$rootScope = $rootScope;
        this.$q = $q;
        this.toaster = toaster;
        this.DeregisterService = DeregisterService;
        this.watchers = this.DeregisterService.create(this.$scope);

        this.loading = false;
        this.columns = [];
        this.commonColumnNames = [];
        this.card = undefined;
        this.metric = undefined;
    }

    $onInit() {
        this.card = this.parent.card;
        this.watchers.onRoot('cardBuilderMetrics.selectedMetric', (event, metric) => {
            this.query = '';
            this.loadAvailableColumns(metric);
        });
        this.watchers.onRoot('cardBuilderMetrics.addedMetric', () => {
            this.updateCommonMetrics();
        });
        this.watchers.onRoot('cardBuilderMetrics.removedMetric', (event, metric) => {
            if(!this.metric) return;

            if(this.metric.id === metric.id) this.reset();
        });

    }

    filters(column) {
        return this.card.filters.getByDataSet(this.metric).filter(item => item.column.id === column.id);
    }

    groupings(column) {
        return this.card.groupings.filter(item => item.column.id === column.id);
    }

    addNewFilter(column) {
        this.$rootScope.$broadcast('filter.addForColumn', column);
    }

    addNewGrouping(column) {
        this.$rootScope.$broadcast('grouping.addForColumn', column);
    }

    loadAvailableColumns(metric) {
        this.metric = metric;

        if(!this.card || !this.metric) return false;

        this.loading = true;
        return this.card.filters.loadAvailableColumnsForMetric(this.metric.rawId).then(response => {
            return this.updateCommonMetrics().then(() => {
                response.forEach(item => {
                    item.metricVirtualId = this.metric.virtualId;
                });
                
                // Sort dimension columns by name
                response.sort((a, b) => a.getLabel().localeCompare(b.getLabel()));

                this.initTablesAndColumns(response);
            });
        }).finally(() => {
            this.loading = false;
        });
    }

    updateCommonMetrics() {
        const metricIds = this.card.metrics.filter(m => m.isRegular()).map(m => m.rawId);
        return this.$q.all(
            metricIds.map(metricId => this.card.filters.loadAvailableColumnsForMetric(metricId))
        ).then(columnsFromAllMetrics => {

            const arrays = columnsFromAllMetrics.map(columnArray => columnArray.map(col => col.name))
                .sort((a, b) => a.length - b.length);

            this.commonColumnNames = arrays.shift().reduce((res, v) => {
                if (res.indexOf(v) === -1 && arrays.every((a) => a.indexOf(v) !== -1)) {
                    res.push(v);
                }
                return res;
            }, []);

            return true;
        }).catch(() => {
            this.toaster.error(`Something went wrong while trying to retrieve available columns for metric(s) with id(s): ${metricIds.join(', ')}`);
        });
    }

    couldBeGroupedBy(columns) {
        return this.commonColumnNames.indexOf(columns.name) > -1;
    }

    reset() {
        this.loading = false;
        this.query = '';
        this.columns = [];
        this.metric = undefined;
    }
    
    initTablesAndColumns(columns) {
        this.allColumns = columns;
        this.allTables = this.groupColumnsByTable(this.allColumns);
        
        this.filter();
    }
    
    filter() {
        this.columns = this.$filter('searchByProperties')(this.allColumns, 'getLabel, tableName', this.query);
        this.tables = this.groupColumnsByTable(this.columns);
    }
    
    groupColumnsByTable(columns) {
        return columns.reduce((tables, column) => {
            let table = tables.find(item => item.name === column.tableName);
        
            if(!table) {
                tables.push({
                    name: column.tableName,
                    columns: [column],
                });
            } else {
                table.columns.push(column);
            }
        
            return tables;
        }, []).sort((a, b) => a.name.localeCompare(b.name));
    }
}

truedashApp.component('appCardBuilderDimensions', {
    require: {
        parent: '^appBuilder'
    },
    controller: CardBuilderController,
    templateUrl: 'content/builder/dimensions/cardBuilderDimensions.html'
});
