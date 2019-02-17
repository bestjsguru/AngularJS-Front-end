'use strict';

/**
 * This service is used as an API for jsPlumb library
 */

class PlumbService {
    constructor($scope, canvasInstance, TableRelationService, $q, DeregisterService) {
        this.$scope = $scope;
        this.canvas = canvasInstance;
        this.TableRelationService = TableRelationService;
        this.watchers = DeregisterService.create($scope);
        this.$q = $q;
    }

    connect(connectionParams, persist = true) {

        if(this.connectionExists(connectionParams)) return false;
        
        let promise = this.$q.when();
        if (persist) {
            promise = this.TableRelationService.create(connectionParams);
        }

        return promise.then(relationData => {
            let relation = connectionParams.connection || relationData;

            this.$scope.$broadcast('schema:connectionCreated', {sourceId: connectionParams.source, targetId: connectionParams.target, relation, countConnections: connectionParams.countConnections });
            return this.watchers.timeout(() => this.addToDOM(relation));
        });

    }

    connectTableRelation(connectionParams) {
        return this.TableRelationService.create(connectionParams, true).then((relation)=>{

            this.$scope.$broadcast('schema:connectionNewCreated', {sourceId: relation.source, targetId: relation.target, relation, countConnections: relation.countConnections});

            return relation;
        });

    }

    update(connection, oldConnection) {

        return this.TableRelationService.update(connection.relation)
            .then((relationData) => {
                this.deleteFromDOM(oldConnection);

                this.$scope.$broadcast('schema:connectionUpdate', {'newConnection': connection, 'oldConnection': oldConnection});

            });
    }

    defineClickEvent(connection) {
        connection.bind('click', conn => {
            this.$scope.$broadcast('schema:editConnection', {
                sourceId: conn.source.parentNode.id,
                targetId: conn.target.parentNode.id,
                id: connection.id,
                relation: connection.getData()
            });
        });
    }

    defineHoverEvent(connection) {
        connection.bind('mouseover', conn => this.$scope.$broadcast('schema:highlightColumns', conn.getData()));
        connection.bind('mouseout', conn => this.$scope.$broadcast('schema:unhighlightColumns', conn.getData()));
    }


    detach(connection) {
        return this.TableRelationService.delete(connection.relation.id)
            .then(() => {

                this.deleteFromDOM(connection);
                this.$scope.$broadcast('schema:connectionDeleted', connection);


            });
    }

    addToDOM(relation) {
        let sourceColumn = relation.getSourceTableId(),
            targetColumn = relation.getTargetTableId();

        let currentConnections = this.canvas.getConnections({ source: sourceColumn, target: targetColumn}).length +
                                 this.canvas.getConnections({ source: targetColumn, target: sourceColumn}).length;

        let curviness = 50 - currentConnections * 50;
        let hasMultipleConnections = relation.hasReversePair || relation.hasSameRelation;

        let getRandomColor = () => {
            let letters = '0123456789ABCDEF'.split('');
            let color = '#';
            for (let i = 0; i < 6; i++ ) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        };

        let color = getRandomColor();

        let connection = this.canvas.connect({
            source: sourceColumn,
            target: targetColumn,
            anchor: [
                [1, 0.5, 1, 0],
                [0, 0.5, -1, 0]
            ],
            paintStyle: { strokeStyle: color, fillStyle: 'none', opacity: 0.5, lineWidth:3 },
            endpointStyle: { strokeStyle: '#666', fillStyle: color },

            // connector: 'Straight',
            connector: hasMultipleConnections ? [ 'StateMachine', {curviness}] : 'Straight',
            detachable: false
        });

        if (!connection) return false;

        connection.setData(relation);

        this.defineClickEvent(connection);
        this.defineHoverEvent(connection);

        return connection;
    }

    findConnection(relation) {
        return this.canvas.getConnections({
          source: relation.getSourceTableId(),
          target: relation.getTargetTableId()
        });
    }

    deleteFromDOM(connection) {
        let relation = connection.relation ? connection.relation : connection;

        let conn = this.findConnection(relation);
        if (relation && conn[0]) {
            // ubinds all events
            conn[0].unbind();
            this.canvas.detach(conn[0]);
            return true;
        }
        return false;
    }
    
    connectionExists(connectionParams) {
        let id = _.get(connectionParams, 'connection.id');
        
        if(!id) return false;
    
        return this.canvas.getConnections().filter(item => id === _.get(item.getData(), 'id')).length > 0;
    }
}

truedashApp.factory('PlumbService', (TableRelationService, $q, DeregisterService) => {
    return {
        create: ($scope, canvas) => new PlumbService($scope, canvas, TableRelationService, $q, DeregisterService)
    };
} );

