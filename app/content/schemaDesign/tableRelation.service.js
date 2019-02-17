'use strict';

class TableRelationService {
    constructor(DataProvider, MetricDataService, $q, TableRelationModel) {
        this.DataProvider = DataProvider;
        this.MetricDataService = MetricDataService;
        this.TableRelationModel = TableRelationModel;
        this.$q = $q;
    }

    getAll() {
        return this.$q.all([this.DataProvider.get('tableRelation/all'), this.MetricDataService.loadOrganisationTables(true)])
            .then(responses => {
                var relations = [];
                responses[0].forEach(tableRelation => {
                    var table1 = responses[1].find(table => table.id == tableRelation.firstTable);
                    if (!table1) {
                        console.warn('Table with id ' + tableRelation.firstTable + ' doesn\'t exist');
                        return;
                    }
                    var column1 = table1.columns.find(column => column.id == tableRelation.firstColumn);
                    var table2 = responses[1].find(table => table.id == tableRelation.secondTable);
                    if (!table2) {
                        console.warn('Table with id ' + tableRelation.secondTable + ' doesn\'t exist');
                        return;
                    }
                    var column2 = table2.columns.find(column => column.id == tableRelation.secondColumn);
                    if (!column1 || !column2 || !table1 || !table2) return;
                    relations.push(new this.TableRelationModel(tableRelation, {table1, table2, column1, column2}));
                });
                return relations;
            })
            .then(relations => {
                relations.forEach(relation => {
                    var rel = relations.find(relationItem => relationItem.sourceColumn.id == relation.targetColumn.id && relationItem.targetColumn.id == relation.sourceColumn.id);
                    if (rel) relation.hasReversePair = true;
                });
                return relations;
            })
            .then(relations => {
                relations.forEach(relation => {
                    var rel = relations.filter(relationItem => relationItem.sourceColumn.id == relation.sourceColumn.id && relationItem.targetColumn.id == relation.targetColumn.id);
                    if (rel.length > 1) relation.hasSameRelation = true;
                });
                return relations;
            });
    }

    invalidateGetAll() {
        this.DataProvider.clearCache('tableRelation/all', false, 'get');
    }

    prepareData(tableRelation, withId = false) {
        let extraConditions = [];

        if (tableRelation.extraConditions.length) {
            tableRelation.extraConditions.forEach((item)=> {
                let i = {
                    id: item.id,
                    firstColumn: item.firstColumn,
                    secondColumn: item.secondColumn,
                    operator: item.operator.value,
                    chainLetter: item.chainLetter
                };
                extraConditions.push(i);
            });
        }

        var data = {
            firstColumn: tableRelation.sourceColumn.id,
            secondColumn: tableRelation.targetColumn.id,
            firstTable: tableRelation.sourceTable.id,
            secondTable: tableRelation.targetTable.id,
            joinType: tableRelation.joinType,
            extraConditions: extraConditions

        };

        if (withId)
            data.id = tableRelation.id;

        if(tableRelation.extraConditionsFormula) data.extraConditionsFormula = tableRelation.extraConditionsFormula;
        return data;
    }

    create(tableRelation) {
        var data = this.prepareData(tableRelation),
        tableRes;

        return this.DataProvider.post('tableRelation/add', data)
            .then(response => {
                tableRelation.id = response.id;
                var table = new this.TableRelationModel(tableRelation, {table1: tableRelation.sourceTable, table2: tableRelation.targetTable, column1: tableRelation.sourceColumn, column2: tableRelation.targetColumn});
                table.source = tableRelation.source;
                table.target = tableRelation.target;
                tableRes = table;
                return this.getAll();
            })
            .then(relations => {
                var reverseConn = relations.find(relationItem => relationItem.sourceColumn.id == tableRes.targetColumn.id && relationItem.targetColumn.id == tableRes.sourceColumn.id);
                if (reverseConn) tableRes.hasReversePair = true;
                this.invalidateGetAll();
                return tableRes;
            });


    }

   update(tableRelation) {
        var data = this.prepareData(tableRelation, true);

        return this.DataProvider.post('tableRelation/update', data)
            .then(response => {
                this.invalidateGetAll();
                return tableRelation;
            });
    }

    delete(tableRelationId) {
        return this.DataProvider.get('tableRelation/remove', {id: tableRelationId}, false)
            .then(response => this.invalidateGetAll());
    }

    /**
     * @param {Number} tableId
     * @returns {Promise}
     */
    getRelatedTables(tableId){
        if(!_.isNumber(tableId)){
            return this.$q.reject('wrong argument');
        }

        return this.DataProvider.get('table/tablesByTableRelation', {
            tableId: +tableId
        });
    }

    /**
     * @param {Number} tableId
     * @returns {Promise}
     */
    getRelatedColumns(tableId){
        if(!_.isNumber(tableId)){
            return this.$q.reject('wrong argument');
        }

        return this.DataProvider.get('table/columnsByTable', {
            id: +tableId
        });
    }

}

truedashApp.service('TableRelationService', TableRelationService);
