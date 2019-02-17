'use strict';

import CodemirrorConfig from '../../common/codemirror/codemirrorConfig';
import './data/databaseExplorerSqlData.component';
import './history/databaseExplorerSqlHistory.component';
import './validSql.directive';

class DatabaseExplorerSqlCtrl {
    constructor(DatabaseExplorerService, $element, DeregisterService, $scope, $rootScope) {
        this.$element = $element;
        this.$rootScope = $rootScope;
        this.codemirrorConfig = new CodemirrorConfig();
        this.DatabaseExplorerService = DatabaseExplorerService;
        this.watchers = DeregisterService.create($scope);

        this.loading = false;
        this.submitted = false;
    }

    $onInit() {
        this.watchers.watchCollection('$ctrl.tables', this.setCodemirrorTables.bind(this));

        this.$element.on('keydown', (event) => {
            // trigger submit on CMD+Enter
            if (event.which === 13 && event.metaKey) this.executeSql();
        });

        this.watchers.onRoot('sqlQuery.history.selected', (event, query) => {
            this.query = query;
        });
    }

    setCodemirrorTables(){
        this.codemirrorConfig.setTables(this.tables.reduce((tables, table) => {
            tables[table.label] = table.columns.map(column => column.getLabel());
            return tables;
        }, {}));
    }

    executeSql() {
        this.submitted = true;

        if(this.form.$invalid || this.loading) return;

        this.loading = true;

        this.DatabaseExplorerService.executeSql(this.query, this.getSchemaName()).then(response => {
            this.data = {
                isError: false,
                result: response.result
            };
        }).catch(error => {
            this.data = {
                isError: error.message,
                result: {}
            };
        }).finally(() => {
            this.loading = false;

            this.$rootScope.$broadcast('sqlQuery.executed', this.query);
        });
    }

    getSchemaName() {
        let tableWithSchema = this.tables.find(table => table.name.includes('.'));
        if(tableWithSchema) return tableWithSchema.name.substring(0, tableWithSchema.name.indexOf('.'));

        return '';
    }
}

truedashApp.component('appDatabaseExplorerSql', {
    controller: DatabaseExplorerSqlCtrl,
    templateUrl: 'content/databaseExplorer/sql/databaseExplorerSql.html',
    bindings: {
        tables: '='
    }
});
