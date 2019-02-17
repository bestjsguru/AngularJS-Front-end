'use strict';

import {ConnectionModalCtrl} from './connectionModalCtrl.js';
import {CanvasPositionManager} from './services/CanvasPositionManager';

//jsPlumb augments Array prototype, so we make them non-enumerable, to be safe in (for in loops)
Object.defineProperty(Array.prototype, 'suggest', {
    enumerable: false,
    value: Array.prototype.suggest
});

Object.defineProperty(Array.prototype, 'vanquish', {
    enumerable: false,
    value: Array.prototype.vanquish
});

class SchemaViewerCtrl {
    constructor($scope, $uibModal, DeregisterService, ConnectionService, $filter, PlumbService, $element, $document) {

        this.$scope = $scope;
        this.ConnectionService = ConnectionService;
        this.PlumbService = PlumbService;
        this.DeregisterService = DeregisterService;
        this.$filter = $filter;
        this.$scope = $scope;
        this.watchers = DeregisterService.create($scope);
        this.$uibModal = $uibModal;
        this.isLoading = true;
        this.$element = $element;
        this.$document = $document;
        this.isConnectionLoading = false;

        this.PositionService = new CanvasPositionManager($element);

        this.modalSettings = {
            templateUrl: 'content/schemaDesign/connectionModal.html',
            controller: ConnectionModalCtrl,
            controllerAs: 'conn',
            size: 'lg',
            windowClass: 'connection-modal-window'
        };

        this.watchers.on('schema:editConnection', (event, params) => this.openEditConnection(params));

        this.watchers.on('schema:connectionCreated', (event, params) => this.connectionCreated(params));
        this.watchers.on('schema:connectionNewCreated', (event, params) => this.connectionNewCreated(params));
        this.watchers.on('schema:connectionDeleted', (event, params) => this.connectionDeleted(params));
        this.watchers.on('schema:connectionUpdate', (event, params) => this.connectionUpdate(params));


        /** @type {ConnectionCollection} **/
        this.loadedConnections = null;
    }

    init() {
        this.isLoading = false;
        this.instance = this.jsPlumbInit();
        this.plumb = this.PlumbService.create(this.$scope, this.instance);

        this.data = {
            instance: this.instance
        };

        this.connections = [];

        this.loadConnections();
    }

    $onInit() {

        // If pulled from the cache, don't set up a watcher
        if (!_(this.tables).isArray())
            var tableWatcher = this.watchers.on('schema:tablesInitialized', (event, tables) => {
                this.tables = tables;
                this.init();
                tableWatcher();
            });
        else
            this.init();

        this.parentWatchers = this.DeregisterService.create(this.parent.$scope);

        var event, tableId;

        this.parentWatchers.on('bag-one.drag', (e, el) => {
            this.$document.on('mousemove', e => event = e);
            tableId = el.attr('data-id');
        });

        this.parentWatchers.on('bag-one.drop', () => {
            this.$document.off('mousemove');
            if (!this.tables.find(table => table.id == tableId)) return;

            var eventPositions = {
                top: event.pageY  - event.offsetY,
                left: event.pageX  - event.offsetX
            };

            this._putCatchedTable(tableId, eventPositions);
            this._putRelatedTables(tableId, eventPositions);

            this.$scope.$apply();
            this.connectTable(tableId);
    
            // Force plumb to repaint everything in order to properly link existing connections with new table position
            this.watchers.timeout(() => this.instance.repaintEverything());
        });

        this.toggleFullscreen = () => this.parent.fullscreen = !this.parent.fullscreen;
        this.isFullscreen = () => this.parent.fullscreen;
        this.clearCanvas = () => {
            this.tables.forEach(table => {
                table.isSelected = false;
                table.style = {};

            });

            this.instance.deleteEveryEndpoint();
            this.connections = [];

        };
    }

    $onDestroy() {
        this.instance.reset();
    }

    _putCatchedTable(tableId, eventPositions){
        var table = this.tables.find(table => table.id == tableId);
        table.isSelected = true;
        table.style = this.PositionService._getTableCanvasPosition(eventPositions);
    }

    _putRelatedTables(tableId, eventPositions){
        var relatedTableIds = this.loadedConnections.getRelatedTableIds(tableId);

        this.tables
            .filter(table => relatedTableIds.includes(table.id))
            .filter(table => !table.isSelected)
            .forEach((table, order, list)=> {
                table.isSelected = true;
                table.style = this.PositionService._getCatchedElRelatedOffset(eventPositions, order, list.length);
                table.style.zIndex = order;
            });
    }

    loadConnections() {
        this.isConnectionLoading = true;
        return this.ConnectionService.load()
            .then((collection) => {
                this.isConnectionLoading = false;
                this.loadedConnections = collection;
            });
    }

    /**
     * @todo: for feature of adding all available tables
     */
    addExistingConnections() {
        this.selectConnectedTables();
        return this.watchers.timeout(() => this.connectTables());
    }

    selectConnectedTables() {
        if (!this.tables) return;
        this.loadedConnections.forEach(connection => {
            this.tables
                .forEach(table => {
                    table.isSelected = table.id == connection.sourceTable.id || table.id == connection.targetTable.id;
                });
        });
    }

    connectTables() {
        this.instance.batch(() => {
            this.loadedConnections
                .forEach(
                    /**
                     * @param {TableRelationModel} connection
                     */
                    (connection) => {
                        this.plumb.connect({
                            source: connection.getSourceTableId(),
                            target: connection.getTargetTableId(),
                            connection
                        }, false);
                    }
                );
        });
    }

    connectTable(tableId) {
        this.loadConnections().then(() =>{
            this.loadedConnections
                .getRelationsByTableId(tableId)
                .filter(connection => {
                    var tables = this.tables.filter(table => table.isSelected);
                    if (tables.find(table => table.id == connection.sourceTable.id) && connection.targetTable.id == tableId)
                        return true;
                    else if (tables.find(table => table.id == connection.targetTable.id) && connection.sourceTable.id == tableId)
                        return true;
                    return false;
                })
                .forEach(
                    /**
                     * @param {TableRelationModel} connection
                     */
                     (connection) => {
                        this.plumb.connect({
                            source: connection.getSourceTableId(),
                            target: connection.getTargetTableId(),
                            connection,
                            countConnections: false
                        }, false);
                     }
                );
        });
    }

    openEditConnection(params) {
        var connection = this.$filter('findConnection')(this.connections, params);
        this.modalSettings.resolve = {
            connection: () => connection || params,
            canvasInstance: () => this.instance,
            tables: () => this.tables,
            scope: () => this.$scope
        };
        this.$uibModal.open(this.modalSettings);
    }

    connectionDeleted(params) {
        this.connections = this.$filter('excludeConnection')(this.connections, params);
        this.tables.filter(
            table => [params.relation.sourceTable.id, params.relation.targetTable.id]
                .indexOf(table.id) > -1 )
                .forEach(table => table.connectionCount--
        );

    }

    connectionCreated(params) {
        this.connections.push(params);
        params.countConnections && this.tables
            .filter(table => [params.relation.sourceTable.id, params.relation.targetTable.id]
            .indexOf(table.id) > -1 )
            .forEach(table => table.connectionCount++);
        this.$scope.$broadcast('schema:addConnectedColumns', params);

    }

    connectionNewCreated(params) {
        this.connections.forEach((connection)=> {
            this.plumb.deleteFromDOM(connection);
        });

        this.connections.push(params);
        params.countConnections && this.tables
            .filter(table => [params.relation.sourceTable.id, params.relation.targetTable.id]
                .indexOf(table.id) > -1 )
            .forEach(table => table.connectionCount++);
        this.$scope.$broadcast('schema:refreshColumns', this.connections);

        this.drawAllDONconnection();
    }

    connectionUpdate(params) {

        this.connections = this.$filter('excludeConnection')(this.connections, params.oldConnection);

        this.connections.forEach((connection)=> {
            this.plumb.deleteFromDOM(connection);
        });

        this.connections.push(params.newConnection);
        this.$scope.$broadcast('schema:refreshColumns', this.connections);

        this.drawAllDONconnection();
    }

    jsPlumbInit() {
        var instance = jsPlumb.getInstance({
            DragOptions: { cursor: 'pointer', zIndex: 2000 },
            EndpointHoverStyle: { fillStyle: '#3498db' },
            HoverPaintStyle: { strokeStyle: '#3498db' },
            Container: 'canvas',
            connector: 'Straight',
            Endpoint: ['Dot', { radius: 7 }]
        });

        instance.bind('beforeDrop', (params) => {
            instance.detach(params.connection);
            if (params.connection.sourceId == params.connection.targetId) return;
            params.connection = undefined;
            this.openEditConnection(params);
            return false;
        });

        return instance;
    }

    drawAllDONconnection() {
        this.watchers.timeout(() => {
            this.connections.forEach((connection)=> {
                this.plumb.addToDOM(connection.relation)
            });
        });


    }

}

truedashApp.component('tuSchemaViewer', {
    controller: SchemaViewerCtrl,
    templateUrl: 'content/schemaDesign/schemaViewer.html',
    bindings: {
        tables: '='
    },
    require: {
        parent: '^tuSchemaDesign'
    }
});
