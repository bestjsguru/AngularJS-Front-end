'use strict';

class DatabaseExplorerSqlDataCtrl {

    $onInit() {
        this.data = this.data || {};
    }

    initiated() {
        return !_.isEmpty(this.data);
    }

    showData() {
        return !this.data.isError;
    }

    showError() {
        return this.data.isError;
    }

    get executionTime() {
        let time = this.data.result.executionTime;

        if(time > 1000) {
            return parseFloat(time / 1000).toFixed(2) + ' s';
        }

        return time + ' ms';
    }
}

truedashApp.component('appDatabaseExplorerSqlData', {
    controller: DatabaseExplorerSqlDataCtrl,
    templateUrl: 'content/databaseExplorer/sql/data/databaseExplorerSqlData.html',
    bindings: {
        data: '='
    }
});
