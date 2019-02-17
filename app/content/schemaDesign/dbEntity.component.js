'use strict';

import { sortStringValues } from './helpers/columnsHelper';

const MAXIMUM_COLUMN_SHOW_COUNT = 3;

class DbEntityController {
    constructor($element, $scope, DeregisterService, MetricDataService, SchemaDesignService) {
        this.$element = $element;
        this.$scope = $scope;
        this.maxColumnCount = MAXIMUM_COLUMN_SHOW_COUNT;
        this.MetricDataService = MetricDataService;
        this.watchers = DeregisterService.create($scope);
        /** @type {SchemaDesignService} **/
        this.SchemaDesignService = SchemaDesignService;

        this.columnNames = [];
        this.connectedColumnNames = [];

        this.watchers.on('schema:highlightColumns', (event, relation) => this.highlightColumn(relation));
        this.watchers.on('schema:unhighlightColumns', (event, relation) => this.unhighlightColumn());
        this.watchers.on('schema:refreshColumns', (event, connections) => this.refreshColumns(connections));
        this.watchers.on('schema:addConnectedColumns', (event, connection) => this.addConnectedColumns(connection));
    }

    $onInit() {
        this.initConnection();

        if (!this.table.style && this.table.position && this.table.position.posY && this.table.position.posX) {
            this.table.style = {
                top: this.table.position.posY,
                left: this.table.position.posX
            };
        }

        this.drawHandlers.instance.repaintEverything();

        this.$element.on('mouseup', (event) => {
            if ($(event.target).parent().is('a.remove')) return;
            this.updatePosition();
        });

        this.table.columns.forEach((column)=>{
            this.columnNames.push(column);
        });
        this.columnNames = sortStringValues(this.columnNames, "name");
    }

    $onDestroy() {
        this.$element.off();
        this.drawHandlers.instance.detachAllConnections(this.$element);
        this.drawHandlers.instance.remove(this.$element);
    }

    refreshColumns(connections) {

        let connectedColumnNames = this.getConnectedColumns(connections);
        this.connectedColumnNames.forEach((column, index, object)=>{
            if(connectedColumnNames && !connectedColumnNames.find((connectedColumn)=> connectedColumn.id == column.id)){
                object.splice(index, 1);
            }
        });

        if(connectedColumnNames){
            connectedColumnNames.forEach((column)=> {
                if(!this.connectedColumnNames.find((connectedColumn)=> connectedColumn.id == column.id)){
                    this.connectedColumnNames.push(column);
                }

            });
        }


        this.columnNames.splice(0, this.columnNames.length);
        let columnNames = this.table.columns.filter(column => !this.connectedColumnNames.find(connColumn => column.id == connColumn.id));
        if(columnNames) {
            columnNames.forEach((column)=> {
                this.columnNames.push(column);
            });
        }
    }

    addConnectedColumns(connection) {
        let connectedColumn = this.getConnectedColumn(connection);

        if(connectedColumn && !this.connectedColumnNames.find((column)=> column && connectedColumn && connectedColumn.id == column.id)){
            this.connectedColumnNames.push(connectedColumn);
        }


        this.columnNames.splice(0, this.columnNames.length);
        let columnNames = this.table.columns.filter(column => !this.connectedColumnNames.find(connColumn => column && connColumn && column.id == connColumn.id));
        if(columnNames) {
            columnNames.forEach((column)=> {
                this.columnNames.push(column);
            });
        }
    }

    getConnectedColumns(connections = this.connections) {
        return this.table.columns.filter(column => {
            return connections.find((connection) => {
                return [connection.relation.sourceTable.id + connection.relation.sourceColumn.id, connection.relation.targetTable.id + connection.relation.targetColumn.id].indexOf(this.table.id + column.id) > -1;
            });
        }).sort((a, b) => a.name > b.name);
    }

    getConnectedColumn(connection) {
        return this.table.columns.find(column => {
            return [connection.relation.sourceTable.id + connection.relation.sourceColumn.id, connection.relation.targetTable.id + connection.relation.targetColumn.id].indexOf(this.table.id + column.id) > -1;

        });
    }

    highlightColumn(relation) {
        if (relation.sourceTable.id == this.table.id) {
            this.activeColumn = relation.sourceColumn.name;
        }
        else if (relation.targetTable.id == this.table.id) {
            this.activeColumn = relation.targetColumn.name;
        }
        this.$scope.$digest();
    }

    unhighlightColumn() {
        this.activeColumn = false;
        this.$scope.$digest();
    }

    initConnection() {
        this.drawHandlers.instance.batch(() => {
            this.$element.attr('id', this.getId());
            this.$element.attr('rel', this.table.id);
            this.addEndpoint();
            this.drawHandlers.instance.makeSource(this.$element, {
                filter: 'div.panel-heading > .panel-title',
                filterExclude: true,
                anchor: [
                    [1, 0.5, 1, 0],
                    [0, 0.5, -1, 0]
                ],
                connector: 'Straight'
            });
            this.drawHandlers.instance.makeTarget(this.$element, {
                anchor: [
                    [1, 0.5, 1, 0],
                    [0, 0.5, -1, 0]
                ]
            });
            this.makeDraggable();
        });

    }

    addEndpoint() {
        this.drawHandlers.instance.addEndpoint(this.$element, {
            endpoint: 'Blank'
        });
    }

    makeDraggable() {
        this.drawHandlers.instance.draggable(this.$element, {
            handle: 'div.panel-heading > .panel-title',
            filter: ':not(a)',
            drag: evt => {
                var node = evt.el;

                if (parseInt (node.style.top) < 0)
                    node.style.top = '0px';

                if (parseInt (node.style.left) < 0)
                    node.style.left = '0px';
            }
        });
    }

    deselectTable() {
        this.table.isSelected = false;
    }

    getId() {
        return 'entity_' + this.table.id;
    }

    updatePosition() {
        if (this.table.position && this.table.position.posX == parseInt(this.$element.css('left')) && this.table.position.posY == parseInt(this.$element.css('top'))) return;
        this.MetricDataService.updateTablePosition(this.table.id, {posX: parseInt(this.$element.css('left')), posY: parseInt(this.$element.css('top'))})
            .then(() =>
                this.table.position = {
                    posX: parseInt(this.$element.css('left')),
                    posY: parseInt(this.$element.css('top'))
                }
            );
    }

    toggleShowAllColumns(state) {
        if (state)
            this.showAllColumns = state;
        else
            this.showAllColumns = !this.showAllColumns;
        this.drawHandlers.instance.repaintEverything();
    }

    openModal(){
        this.SchemaDesignService.openExportRawDataModal(this.table);
    }
}

truedashApp.component('tuDbEntity', {
    controller: DbEntityController,
    templateUrl: 'content/schemaDesign/dbEntity.html',
    bindings: {
        drawHandlers: '=',
        table: '=',
        connections: '='
    }
});
