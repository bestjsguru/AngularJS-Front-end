'use strict';

import './databaseExplorer.service';
import Tabs from '../common/tabs';
import {ColumnEntityModel} from '../card/model/columnEntity.model';
import './preview/databaseExplorerPreview.component';
import './sql/databaseExplorerSql.component';
import './table/databaseExplorerTable.component';

class DatabaseExplorerCtrl {
    constructor($state, MetricDataService, $filter) {
        this.$state = $state;
        this.$filter = $filter;
        this.MetricDataService = MetricDataService;

        this.tabs = new Tabs(['sql', 'preview']);
        this.tabs.activate(this.$state.params.tab);

        this.loading = false;
        this.tables = [];
        this.table = null;
        this.tableFilter = '';
    }

    $onInit() {
        this.loading = true;
        this.MetricDataService.loadOrganisationTables().then(tables => {
            this.allTables = tables.map(table => {
                table.columns = table.columns.map(column => new ColumnEntityModel(column));
                return table;
            });

            this.filter();
            this.preselectTable();
        }).finally(() => {
            this.loading = false;
        });
    }

    filter() {
        this.saveCollapsedState();

        this.tables = this.$filter('customSearch')(this.allTables, 'label,source', this.tableFilter);

        this.sources = this.groupTablesBySource(this.tables);
        this.tableFilter.length && this.sources.forEach(source => source.collapsed = false);
        this.applyCollapsedState();
    }

    saveCollapsedState() {
        if(this.tableFilter.length && !this.collapsedState) {
            this.collapsedState = _.clone(this.sources);
        }
    }

    applyCollapsedState() {
        if(!this.tableFilter.length && this.collapsedState) {
            this.sources.map(source => {
                this.collapsedState.forEach(state => {
                    if(source.name === state.name) source.collapsed = state.collapsed;
                });
            });

            this.collapsedState = null;
        }
    }

    setTab(tab) {
        this.tabs.activate(tab);
        this.$state.go('.', {tab: tab}, {notify: false});
    }

    preselectTable() {
        if(!this.$state.params.table) return;

        this.sources.forEach(source => {
            let table = source.tables.find(item => item.id === parseInt(this.$state.params.table));
            if(table) {
                this.toggleSource(source);
                this.toggleTable(table);
            }
        });
    }

    toggleSource(source) {
        this.sources.forEach(item => {
            item.collapsed = item.name === source.name ? !source.collapsed : true;
        });
    }

    toggleTable(table) {
        if(this.table && this.table.id === table.id) {
            this.table = null;
        } else {
            this.table = table;
        }

        let tableId = this.table ? this.table.id : null;

        this.$state.go('.', {table: tableId}, {notify: false});
    }

    previewTable(table) {
        this.table = table;

        let tab = this.table ? 'preview' : 'sql';

        this.setTab(tab);
        this.$state.go('.', {table: table.id, tab: tab}, {notify: false});
    }

    get numberOfColumns() {
        return this.table ? this.table.columns.length : 0;
    }

    isActiveSource(source) {
        return this.table && source.tables.find(table => table.id === this.table.id);
    }

    groupTablesBySource(tables) {

        let sources = {};

        // Sort table sources alphabetically
        tables.sort((a, b) => a.source.localeCompare(b.source));

        tables.forEach(table => {
            if(sources[table.source]) return sources[table.source].tables.push(table);

            sources[table.source] = {
                name: table.source,
                collapsed: true,
                tables: [table]
            };
        });

        // Sort all metrics alphabetically
        return _.values(sources).map(source => {
            source.tables.sort((a, b) => a.label.localeCompare(b.label));

            return source;
        });
    }
}

truedashApp.component('appDatabaseExplorer', {
    controller: DatabaseExplorerCtrl,
    templateUrl: 'content/databaseExplorer/databaseExplorer.html'
});
