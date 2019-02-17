"use strict";

export class ColumnHelper {
    static sortedMetrics(metrics) {
        let regularMetricsSorted = _.sortBy(metrics.filter(m => m.isRegular()), m => m.virtualId);
        let comparableMetricsSorted = _.sortBy(metrics.filter(m => m.isComparable()), m => m.virtualId);
        let formulaMetricsSorted = _.sortBy(metrics.filter(m => m.isFormula()), m => m.virtualId);
        return [...regularMetricsSorted, ...comparableMetricsSorted, ...formulaMetricsSorted];
    }

    static assignTablesToColumns(columns, tables) {
        columns.forEach(column => {
            // This code solve the problem for columns from different tables and should be tested for differet cases
            /*
            let found = columns.find(item => item.id != column.id && item.name.toLowerCase() == column.name.toLowerCase());
            if (found) {
                found.tableName = tables.find(table => table.id == found.tableId).name;
                let pos = found.tableName.indexOf('.');
                if (pos > -1)
                    found.tableName = found.tableName.slice(pos + 1);
            }
            */
            let tableItem = tables.find(table => table.id === column.tableId);
            if (tableItem) {
                column.tableName = tableItem.name;
                let pos = column.tableName.indexOf('.');
                if (pos > -1)
                    column.tableName = column.tableName.slice(pos + 1);
            }
        });
    }
    
    static isNumberType(type) {
        return ['integer', 'decimal'].includes(type.toLowerCase());
    }
    
    static isDateType(type) {
        return ['date', 'timestamp'].includes(type.toLowerCase());
    }
}
