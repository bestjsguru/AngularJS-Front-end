'use strict';

import {MetricDataHelper} from '../../metricData/metricData.helper.js';
import {ColumnHelper} from '../../../card/datatable/column.helper.js';
import CodemirrorConfig from '../../../common/codemirror/codemirrorConfig';

class QueryStatementCtrl {

    /**
     * @param {DeregisterService} DeregisterService
     * @param {MetricDataService} MetricDataService
     */
    constructor($scope, DeregisterService, MetricDataService) {
        this.$scope = $scope;
        this.DeregisterService = DeregisterService;
        this.MetricDataService = MetricDataService;
        this.codemirrorConfig = new CodemirrorConfig();
        this.codemirrorConfig.disableKeywords();

        this.watchers = this.DeregisterService.create(this.$scope);

        this.loading = false;
        this.functions = MetricDataHelper.defaultFunctions();
    }

    $onInit() {
        this.watchers.watch('$ctrl.columns.loading', (loading) => {
            this.loading = loading;
        });
        this.watchers.watch('$ctrl.columns.items', (columns) => {
            if(columns.length) {
                this.data.transformFromServer(columns);
                this.addTableNamesToColumns();
            }
        });
        this.addTableNamesToColumns();
    }

    setCodemirrorTables(){
        let functions = this.functions.map(item => ({ text: item.expression }));
        let tables = this.columns.items.map(column => ({ text: `${column.tableName}.${column.name}` })).sort((a, b) => {
            if(a.text < b.text) return 1;
            if(a.text > b.text) return -1;
            return 0;
        });

        this.codemirrorConfig.setTables([...functions, ...tables]);
    }

    addTableNamesToColumns() {
        this.MetricDataService.loadOrganisationTables(true)
            .then(tables => ColumnHelper.assignTablesToColumns(this.columns.items, tables))
            .then(() => this.setCodemirrorTables());
    }

    loadingPlaceholder() {
        if(this.loading) return 'Loading...';
        if (!this.data.complexity) return 'Select Type first';
        if(!this.data.table) return 'Select table first';
        if(!this.columns.items.length) return 'No columns';

        return 'You can use + - / * ( )';
    }
}

truedashApp.component('tuQueryStatement', {
    controller: QueryStatementCtrl,
    templateUrl: 'content/metricBuilder/query/statement/queryStatement.html',
    bindings: {
        data: '=',
        columns: '='
    }
});
