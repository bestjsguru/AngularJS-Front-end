'use strict';

class AvailableColumnsService {

    /**
     * @param {MetricDataService} MetricDataService
     */
    constructor(MetricDataService, $rootScope) {
        this.$rootScope = $rootScope;
        this.MetricDataService = MetricDataService;
    }

    /**
     * @param {MetricModel} metric
     * @param {{}[]} columns
     */
    update(metric, columns){
        var params = {metricId: metric.id, columnList: []};
        var metricInfoColumns = [];

        Object.values(columns).forEach((list) => {
            list.forEach(column => {
                params.columnList.push({
                    availableColumn: column.id,
                    isGrouping: !!column.groupable,
                    isFiltering: !!column.filterable
                });
                metricInfoColumns.push({
                    availableColumn: column,
                    isGrouping: !!column.groupable,
                    isFiltering: !!column.filterable
                });
            });
        });

        var dest = metric;

        return this.MetricDataService.saveAvailableColumns(params).then(() => {
            dest.info.availableColumns = metricInfoColumns;
            this.$rootScope.$emit('metric.columns.updated');
            this.MetricDataService.clearAvailableColumnsCache(dest.id);
        });
    }

    cloneIntoMetric(metric, metricInfoColumns){
        var params = {
            metricId: metric.id,
            columnList: metricInfoColumns.map((column) => {
                column.availableColumn = column.availableColumn.id;

                return column;
            })
        };

        return this.MetricDataService.saveAvailableColumns(params).then(() => {
            metric.info.availableColumns = metricInfoColumns;
        });
    }
}

truedashApp.service('AvailableColumnsService', AvailableColumnsService);
