'use strict';

import CodemirrorConfig from '../../../common/codemirror/codemirrorConfig';

class DerivedTableCtrl {
    constructor(DeregisterService, $scope, MetricDataService, toaster, $rootScope, TableCacheHelperService) {
        this.watchers = DeregisterService.create($scope);
        this.MetricDataService = MetricDataService;
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.TableCacheHelperService = TableCacheHelperService;
        
        this.loading = false;
        this.codemirrorConfig = new CodemirrorConfig();
    }
    
    $onInit() {
        this.source = this.resolve.source;
        this.table = this.resolve.table;
    
        if(this.table) {
            this.name = this.table.name;
            this.query = this.table.statement;
        }
        
        this.loading = true;
        this.MetricDataService.loadOrganisationTables().then((tables) => {
            this.tables = tables;
            
            this.watchers.interval(() => {
                this.setCodemirrorTables();
                this.codemirrorConfig.editor.refresh();
            }, 100);
        }).finally(() => {
            this.loading = false;
        });
    }
    
    setCodemirrorTables(){
        this.codemirrorConfig.setTables(this.tables.map(table => ({ text: table.name })).sort((a, b) => {
            if(a.text < b.text) return 1;
            if(a.text > b.text) return -1;
            return 0;
        }));
    }
    
    save() {
        if(this.form && !this.form.$invalid) {
            this.loading = true;
            
            let promise = this.table ? this.edit() : this.create();
            
            promise.catch((error) => {
                this.toaster.error(error.message);
            }).finally(() => {
                this.loading = false;
            });
        }
    }
    
    create() {
        return this.MetricDataService.createTable({
            type: 'derived',
            name: this.name,
            statement: this.query,
            truedashDataSource: this.source.id,
        }).then((table) => {
            this.TableCacheHelperService.addTable(table);
            this.$rootScope.$broadcast('insight.tableCreated', table);
            this.toaster.success('Table created');
            this.dismiss();
        });
    }
    
    edit() {
        return this.MetricDataService.editTable({
            id: this.table.id,
            type: 'derived',
            name: this.name,
            statement: this.query,
            truedashDataSource: this.source.id,
        }).then((table) => {
            this.TableCacheHelperService.updateTable(table);
            this.$rootScope.$broadcast('insight.tableUpdated', table);
            this.toaster.success('Table updated');
            this.dismiss();
        });
    }
    
    dirty(field) {
        return (field && field.$dirty);
    }
}

truedashApp.component('appDerivedTable', {
    controller: DerivedTableCtrl,
    templateUrl: 'content/dataset/insight/derivedTable/derivedTable.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
