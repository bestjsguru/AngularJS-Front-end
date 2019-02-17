'use strict';

class DataSourceController {
    constructor($scope, TableRelationService, DeregisterService, SchemaDesignService) {
        this.TableRelationService = TableRelationService;
        this.DeregisterService = DeregisterService;
        this.watchers = DeregisterService.create($scope);
        /** @type {SchemaDesignService} **/
        this.SchemaDesignService = SchemaDesignService;

        this.isCollapsed = false;

        this.isLoading = false;

        this.$scope = $scope;
    }

    $onInit() {
        this.parentWatchers = this.DeregisterService.create(this.parent.$scope);
        this.parentWatchers.on('bag-one.drag', (e, el) => this.parent.dragTableId = el.attr('data-id'));
        this.isFullscreen = () => this.parent.fullscreen;
    }

    toggleTable(tables) {
        if (!angular.isArray(tables)) tables = [tables];
        tables.forEach(table => table.isSelected ? table.isSelected = false : false);
    }

    openModal(table){
        this.SchemaDesignService.openExportRawDataModal(table);
    }
}

truedashApp.component('tuDataSource', {
    controller: DataSourceController,
    templateUrl: 'content/schemaDesign/dataSource.html',
    require: {
        parent: '^tuSchemaDesign'
    },
    bindings: {
        tables: '='
    }
});
