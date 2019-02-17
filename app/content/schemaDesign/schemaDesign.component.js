'use strict';

class SchemaDesignController {
    constructor(MetricDataService, $state, $scope, dragulaService, DeregisterService, TableRelationService, AppEventsService) {
        this.MetricDataService = MetricDataService;
        this.TableRelationService = TableRelationService;
        this.$state = $state;
        this.watchers = DeregisterService.create($scope);
        this.$scope = $scope;
        this.fullscreen = false;
    
        AppEventsService.track('used-schema-designer');

        dragulaService.options($scope, 'bag-one', {
            copy: true,
            copySortSource: false
        });

        this.init().then(() => $scope.$broadcast('schema:tablesInitialized', this.tables));
    }
    
    refresh() {
        this.init(false).then(() => this.$scope.$broadcast('schema:tablesInitialized', this.tables));
    }

    init(useCache = true) {
        this.tables = [];
        return this.MetricDataService.loadOrganisationTables(useCache).then(tables => {
            this.tables = tables.map(table => {
                table.connectionCount = 0;
                return table;
            });
        });
    }
}

truedashApp.component('tuSchemaDesign', {
    controller: SchemaDesignController,
    templateUrl: 'content/schemaDesign/schemaDesign.html'
});
