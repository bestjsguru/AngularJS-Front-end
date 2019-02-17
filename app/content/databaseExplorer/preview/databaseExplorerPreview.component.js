'use strict';

class DatabaseExplorerPreviewCtrl {
    constructor(DatabaseExplorerService, DeregisterService, $scope) {
        this.DatabaseExplorerService = DatabaseExplorerService;
        this.watchers = DeregisterService.create($scope);

        this.loading = false;
    }

    $onInit() {
        this.watchers.watch('$ctrl.table', (table) => {
            if(table) {
                this.loading = true;

                this.DatabaseExplorerService.getTablePreview(table).then(data => {
                    this.data = data;
                }).catch(err => {
                    this.data = null;
                }).finally(() => {
                    this.loading = false;
                });
            } else {
                this.data = null;
            }
        });
    }

    showPreview() {
        return !this.loading && !this.table;
    }

    showError() {
        return !this.loading && this.table && this.data === null;
    }

    showData() {
        return !this.loading && this.table && this.data;
    }

    get executionTime() {
        let time = this.data.executionTime;

        if(time > 1000) {
            return parseFloat(time / 1000).toFixed(2) + ' s';
        }

        return time + ' ms';
    }
}

truedashApp.component('appDatabaseExplorerPreview', {
    controller: DatabaseExplorerPreviewCtrl,
    templateUrl: 'content/databaseExplorer/preview/databaseExplorerPreview.html',
    bindings: {
        table: '='
    }
});
