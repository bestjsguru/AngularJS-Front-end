'use strict';

import {EventEmitter} from '../system/events.js';
import {TableModel} from '../metricBuilder/metricData/table.model.js';
import OPERATORS from '../common/filters/filters.module.js';

class TableRelationModel extends EventEmitter {
    constructor(data, tableData) {
        super();

        data = data || {};

        this.init(data, tableData);
    }

    init(data, tableData) {
        this.id = data.id;
        this.joinType = data.joinType;
        this.order = data.order;
        this.sourceColumn = tableData.column1;
        this.targetColumn = tableData.column2;

        this.sourceTable = new TableModel(tableData.table1);
        this.targetTable = new TableModel(tableData.table2);

        if (data.extraConditions.length) {
            this.extraConditions = _.sortBy(data.extraConditions, 'chainLetter');
            this.extraConditions.forEach((extraConditions)=> {
                extraConditions.operator = OPERATORS.all.find((item) => item.value === extraConditions.operator);
            });
        } else {
            this.extraConditions = [];
        }

        this.extraConditionsFormula = data.extraConditionsFormula ? data.extraConditionsFormula : null;
    }

    getSourceTableId() {
        return `entity_${this.sourceTable.id}_${this.sourceColumn.name}`;
    }

    getTargetTableId() {
        return `entity_${this.targetTable.id}_${this.targetColumn.name}`;
    }

    isSameRelation(relation) {
        let joinType = [this.sourceColumn.id, this.targetColumn.id].join();
        let relationJoinType = [relation.sourceColumn.id, relation.targetColumn.id].join();
        
        return   joinType === relationJoinType;
    }

}

truedashApp.value('TableRelationModel', TableRelationModel);
