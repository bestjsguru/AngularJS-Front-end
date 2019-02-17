
import {Collection} from '../data/collection';

class ConnectionCollection extends Collection{

    /**
     * @param tableId
     * @returns {TableRelationModel[]}
     */
    getRelationsByTableId(tableId){
        return this.filter(connection => connection.sourceTable.id == tableId || connection.targetTable.id == tableId);
    }

    /**
     * @param tableId
     * @returns {Number[]}
     */
    getRelatedTableIds(tableId){
        var list = this
            .getRelationsByTableId(tableId)
            .map((relation) => [
                relation.sourceTable.id,
                relation.targetTable.id
            ]);

        return _.chain(list).flatten().compact().uniq().sort().value();
    }
}

truedashApp.value('ConnectionCollection', ConnectionCollection);

truedashApp.service('ConnectionService', (TableRelationService) => {
    "use strict";

    return {
        load: function() {
            var collection = new ConnectionCollection();

            return TableRelationService
                .getAll()
                .then(connections => {
                    collection.items = connections;
                    return collection;
                });
        }
    };
});
