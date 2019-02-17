'use strict';

import {METRIC_TYPE} from '../../card/model/metric.model';

export class MetricDataHelper {

    static defaultFunctions() {
        return [
            {name: 'Sum', expression: 'sum()', description: 'Returns the total sum of a numeric column'},
            {name: 'Count', expression: 'count()', description: 'Returns the number of rows that matches a specified criteria'},
            {name: 'Distinct', expression: 'distinct()', description: 'Return only distinct (different) values'},
            {name: 'Average', expression: 'avg()', description: 'Returns the average value of a numeric column'},
            {name: 'Median', expression: 'median()', description: 'Returns the number that is halfway into the set'},
            {name: 'Minimum', expression: 'min()', description: 'Returns the smallest value of the selected column'},
            {name: 'Maximum', expression: 'max()', description: 'Returns the largest value of the selected column'},
            {name: 'Percentile', expression: 'percentile()', description: 'Returns the k-th percentile of values in a range'}
        ];
    }

    static defaultComplexities() {
        return [
            {name: 'Standard', value: METRIC_TYPE.DYNAMIC, isComplex: true},
            {name: 'SQL', value: METRIC_TYPE.SQL_BASED, isComplex: false}
        ];
    }
    
    static defaultIsIncrease() {
        return [
            {name: 'Good', value: true},
            {name: 'Bad', value: false}
        ];
    }

    static defaultXAxis() {
        return {
            types: [
                {name: 'Date', value: 'Date'}
            ]
        };
    }

    static defaultYAxis() {
        return {
            types: [
                {name: 'Numeric', value: 'numeric', default: '123'},
                {name: 'Time', value: 'time', default: 'time'},
                {name: 'Currency', value: 'currency', default: '£'},
                {name: 'Percentage', value: 'percentage', default: '%'}
            ]
        };
    }

    static convertStatementFromServer(statement, columns) {

        let tables = MetricDataHelper.groupByTableAndSortByLength(columns);

        statement && tables.forEach((items) => {
            items.forEach(column => {
                statement = statement.replaceAll('{' + column.id + '}', column.tableName + '.' + column.name);
            });
        });

        return statement;
    }

    static convertStatementForServer(statement, columns) {

        let tables = MetricDataHelper.groupByTableAndSortByLength(columns);

        statement && tables.forEach((columns) => {
            columns.forEach(column => {
                statement = statement.replaceAll(column.tableName + '.' + column.name, '{' + column.id + '}');
            });
        });

        return statement;
    }


    /**
     * Group columns by table and sort them by name (longest first).
     * After that sort tables in same manner (longest table first)
     */
    static groupByTableAndSortByLength(columns) {
        columns = columns.sort((a, b) => b.name.length - a.name.length);

        let tables = _.groupBy( columns, 'tableName' );

        return Object.keys(tables).sort((a, b) => b.length - a.length).reduce((result, key) => {
            result.set(key, tables[key]);
            return result;
        }, new Map());
    }

    static isSqlBased(complexity = {}){
        return complexity.value === METRIC_TYPE.SQL_BASED;
    }

    static isDynamic(complexity = {}){
        return complexity.value === METRIC_TYPE.DYNAMIC;
    }

}
