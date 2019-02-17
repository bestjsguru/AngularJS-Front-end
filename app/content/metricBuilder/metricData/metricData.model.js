"use strict";

import {MetricDataHelper} from './metricData.helper.js';

export class MetricDataModel {
    constructor() {
        this.type = 'Chart';

        this.$tmp = {
            statement: ''
        };

    }

    isSqlBased(){
        return MetricDataHelper.isSqlBased(this.complexity);
    }

    isNormal() {
        return MetricDataHelper.isDynamic(this.complexity);
    }

    /**
     * @returns {*}
     */
    prepareToSave() {
        var metricDataUpdated = this.clone();
        let defaultYAxisType = MetricDataHelper.defaultYAxis().types[0];

        if(!metricDataUpdated.description) metricDataUpdated.description = metricDataUpdated.name;
        
        if (metricDataUpdated.isNormal()) {
            // Date column is sometimes saved as ID and sometimes as string on BE, so we have to decide what to send here
            // At the moment only for complexity of "Dynamic Relation" we save data columns as IDs instead of strings
            metricDataUpdated.dateColumn = metricDataUpdated.complexity.isComplex ? metricDataUpdated.dateColumn.id : metricDataUpdated.dateColumn.name;
            metricDataUpdated.table = metricDataUpdated.table.id;
        }

        if(!metricDataUpdated.isSqlBased()){
            metricDataUpdated.source = metricDataUpdated.source.name;
        }

        metricDataUpdated.complexity = metricDataUpdated.complexity.value;
        metricDataUpdated.isIncrease = metricDataUpdated.isIncrease.value;
        metricDataUpdated.numberOfDecimals = metricDataUpdated.numberOfDecimals.value;

        if (metricDataUpdated.xAxis && metricDataUpdated.xAxis.type)
            metricDataUpdated.xAxis.type = metricDataUpdated.xAxis.type.value;

        if (metricDataUpdated.yAxis && _.isObject(metricDataUpdated.yAxis.type)){
            let type = metricDataUpdated.yAxis.type.value;
            let label = metricDataUpdated.yAxis.type.name;
    
            metricDataUpdated.yAxis.type = type;
            metricDataUpdated.yAxis.label = label;
        } else {
            metricDataUpdated.yAxis = {label: defaultYAxisType.name, type: defaultYAxisType.value};
        }

        metricDataUpdated.statement = this.$tmp.statement;

        return metricDataUpdated;
    }

    /**
     * @return {MetricDataModel}
     */
    clone(){
        var clone = new MetricDataModel();

        return angular.extend(clone, this);
    }

    setOrganisation(organisation){
        this.organisation = {
            id : organisation.id
        };
    }

    /**
     * @param {ColumnEntityModel[]} availableColumns
     */
    transformFromServer(availableColumns){
        this.statement = MetricDataHelper.convertStatementFromServer(this.statement, availableColumns);
    }

    transformToServer(columns){
        this.$tmp.statement = MetricDataHelper.convertStatementForServer(this.statement, columns);
    }
}
