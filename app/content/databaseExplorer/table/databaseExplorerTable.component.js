'use strict';

class DatabaseExplorerTableCtrl {

}

truedashApp.component('appDatabaseExplorerTable', {
    controller: DatabaseExplorerTableCtrl,
    templateUrl: 'content/databaseExplorer/table/databaseExplorerTable.html',
    bindings: {
        table: '=',
        executionTime: '=',
        limit: '='
    }
});
