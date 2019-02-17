import {MetricModel} from '../../../card/model/metric.model';

export class FilterDTO {

    /**
     * @param {{}} data
     * @param {MetricModel} metric
     */
    constructor(data, metric) {
        angular.extend(this, {
            chain: 'AND',
            isMetricFilter: true
        });

        angular.extend(this, {
            isRange: data.isRange,
            column: data.column.getJson(),
            operator: data.operator,
            values: data.values,
            chainLetter: data.chainLetter,
            customDateMap: data.customDateMap || data.numbers,
            metric: {
                id: data.metricId
            }
        });

        this.setMetric(metric);
    }

    setMetric(value){
        if(value instanceof MetricModel){
            this.metric = {
                id: value.rawId
            };
        } else {
            this.metric = value;
        }

    }

    /**
     * @param filter
     * @param metric
    * @returns {FilterDTO}
     */
    static fromFilter(filter, metric){
        return new FilterDTO({
            isRange: filter.isRange,
            column: filter.column,
            operator: filter.operator,
            values: filter.values,
            chainLetter: filter.chainLetter,
            customDateMap: filter.customDateMap || filter.numbers
        }, metric);
    }
}
