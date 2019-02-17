'use strict';

import {ColumnEntityModel} from '../../card/model/columnEntity.model.js';

class AvailableColumnsModalCtrl {
    constructor(metric, table, $scope, $filter, toaster, TableRelationService, AvailableColumnsService) {
        this.metric = metric;
        this.table = table;
        this.$scope = $scope;
        this.$filter = $filter;
        this.toaster = toaster;
        /** @type {TableRelationService} **/
        this.TableRelationService = TableRelationService;
        /** @type {AvailableColumnsService} **/
        this.AvailableColumnsService = AvailableColumnsService;
        this.init();
    }

    init() {

        this.tab = 'availableColumns';
        this.filterColumns = '';
        this.availableColumns = {loading: false, items: []};
        this.filteredColumns = [];
        this.showLoader = true;
        this.initRelatedTables()
            .then(this._preselectTable.bind(this))
            .finally(() => {
                this.showLoader = false;
            });

        this.$scope.$watch(
            () => this.selectedTable(),
            (table) => {
                this.availableColumnsActions(table);
            }
        );

        this.$globalSlectedList = {
            items: [],
            available: false
        };

        this.metric.info.availableColumns.forEach(item => {
            let tableId = item.availableColumn.tableId;
            let selectedColumns = this.$globalSlectedList.items[tableId];
            if (!selectedColumns) {
                this.$globalSlectedList.items[tableId] = [item.availableColumn];
            } else {
                selectedColumns.push(item.availableColumn);
            }
        });

        this.$scope.$watch(
            () => this.joinSelectedColumns(),
            () => { this.selectedColumnsActions(); }
        );
    }

    selectedTable() {
        return this.tables.selected;
    }

    availableColumnsActions(table) {
        if(!_.isEmpty(table)){
            this.$globalSlectedList.available = false;
            this.showLoader = true;
            this.initAvailableColumns(table)
                .then(() => this.initMetricColumns())
                .finally(() => {
                    this.showLoader = false;
                });
        }
    }

    selectedColumnsActions() {
        if(!this.$globalSlectedList.available){
            return;
        }
        this.$globalSlectedList.items[this._getTableId()] = this.getSelectedColumns();
    }

    joinSelectedColumns() {
        return this.getSelectedColumns().map(col => col.id).join();
    }

    filter() {
        this.filteredColumns = this.$filter('customSearch')(this.availableColumns.items, 'name,label', this.filterColumns);
        
        // Sort columns by name
        this.filteredColumns.sort((a, b) => a.label.localeCompare(b.label));
    }

    initRelatedTables(){
        this.showLoader = true;

        this.tables = {
            loading: true,
            items: [],
            selected: null
        };

        let tableId = this._getMetricTableId();

        return this.TableRelationService.getRelatedTables(tableId).then((response) => {
            // We want to remove main metric table from the list of
            // options because those columns will always be available
            if(_.isArray(response)) {
                response = response.filter(table => table.id !== tableId);
            }
    
            this.tables.loading = false;
            this.tables.items = response;
        });

    }

    _getMetricTableId() {
        return this.table.id;
    }

    _getTableId() {
        return this.tables.selected.id;
    }

    initAvailableColumns(table = {}) {
        this.availableColumns.loading = true;
        this.availableColumns.items = [];

        return this.TableRelationService.getRelatedColumns(table.id)
            .then((columns) => {
                this.availableColumns.loading = false;
                this.availableColumns.items = columns.map(column => new ColumnEntityModel(column));
                this.filter();
        });
    }

    _preselectTable(){
        this.tables.selected = this.tables.items.length ? this.tables.items[0] : null;
    }

    initMetricColumns() {
        // here we will preselect columns that are already added to a metric
        this.metric.info.availableColumns.forEach(item => {
            var existingColumn = this.availableColumns.items.find(column => column.id == item.availableColumn.id);
            if(existingColumn) {
                existingColumn.selected = true;
                existingColumn.filterable = item.isFiltering;
                existingColumn.groupable = item.isGrouping;
            }
        });

        let $globalSlectedList = this.$globalSlectedList.items[this._getTableId()] || [];
        this.availableColumns.items.map((column) => {
            if(!column.selected){
                column.selected = !!$globalSlectedList.find((item) => column.id === item.id);
            }
        });

        this.$globalSlectedList.available = true;
    }

    getSelectedColumns() {
        return this.availableColumns.items.filter(column => column.selected);
    }

    toggleColumnProperty(property, column) {
        column[property] = !column[property];
    }

    selectAll() {
        this.filteredColumns.map(item => item.selected = true);
    }

    selectNone() {
        this.filteredColumns.map(item => item.selected = false);
    }

    save() {
        this.availableColumns.loading = true;

        return this.AvailableColumnsService
            .update(this.metric, this.$globalSlectedList.items)
            .then(() => {
                this.availableColumns.loading = false;
                this.toaster.success('Column details successfully saved for this metric.');
                this.$scope.$dismiss();
            });
    }
}

class AvailableColumnsCtrl {
    constructor($scope, $uibModal) {
        this.modal = null;
        this.$scope = $scope;
        this.$uibModal = $uibModal;
    }

    open(metric, table) {
        this.modal = this.$uibModal.open({
            templateUrl: 'content/metricBuilder/availableColumns/metricColumns.html',
            controller: AvailableColumnsModalCtrl,
            controllerAs: 'ac',
            scope: this.$scope,
            resolve: {
                metric: () => metric,
                table: () => table,
            },
            size: 'md'
        });
    }
}

truedashApp.directive('tuAvailableColumns', () => {
    return {
        controller: AvailableColumnsCtrl,
        restrict: 'AE',
        controllerAs: 'ac',
        bindToController: true
    };
});
