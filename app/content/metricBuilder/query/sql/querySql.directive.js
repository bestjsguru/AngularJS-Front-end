'use strict';

import CodemirrorConfig from '../../../common/codemirror/codemirrorConfig';

class QuerySqlController {
    constructor($scope, MetricDataService) {
        this.$scope = $scope;
        this.MetricDataService = MetricDataService;
        this.codemirrorConfig = new CodemirrorConfig();

        this.tables = [];
    }

    $onInit() {
        this.metricSources = {
            loading: true,
            items: []
        };

        return this.MetricDataService.loadOrganisationTables().then(sources => {
            this.metricSources.loading = false;
            this.metricSources.items = sources;
            this.setCodemirrorTables();
        });
    }

    setCodemirrorTables(){
        this.codemirrorConfig.setTables(this.metricSources.items.map(table => ({ text: table.name })).sort((a, b) => {
            if(a.text < b.text) return 1;
            if(a.text > b.text) return -1;
            return 0;
        }));
    }
}


truedashApp.directive('tuQuerySql', () => {
    return {
        controller: QuerySqlController,
        templateUrl: 'content/metricBuilder/query/sql/querySql.html',
        scope: {
            data: '='
        },
        restrict: 'AE',
        controllerAs: 'qs',
        bindToController: true
    };
});
