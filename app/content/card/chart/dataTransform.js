'use strict';

import {Helpers} from '../../common/helpers.js';
import {Config} from '../../config';

export const PIE_CHART_LIMIT = 50;

export class DataTransformer {
    constructor(options, datatableTransformerFactory) {
        this.options = options;
        this.datatableTransformerFactory = datatableTransformerFactory;
    }

    transform() {
        if (this.options.metrics.length == 1 &&
            this.options.metrics[0].getType() == 'table' &&
            this.options.metrics[0].getData().results) {
            return ['pie', 'donut'].indexOf(this.options.type) === -1 ? this.transformDatatableLine() : this.transformDatatablePie();
        } else {
            return this.transformChart();
        }
    }

    transformDrill() {
        //works for drill with one metric only

        if (this.options.card.drill.isTotal()) {
            return this.transformDrillTotal();
        } else {
            return this.transformRegularLine();
        }
    }

    transformDrillTotal() {
        var metricsList = this.options.card.drill.isCardDrill() ?
            this.options.card.metrics :
            [this.options.card.drill.getMetric()];
        var groupNum = 0;
        var metrics = this.options.card.metrics;
        while (metrics.originalData.columns && groupNum < metrics.originalData.columns.length &&
            metrics.originalData.columns[groupNum].title) {
            groupNum++;
        }

        return metricsList.map((metric, idx) => {

            var name = metric.name;
            var data = [
                name
            ];

            metrics.originalData.results.forEach(row => {
                data.push(row[groupNum + idx]);
            });
            return data;
        });
    }

    getDrillCategories() {
        var groupNum = 0;
        var metrics = this.options.card.metrics;
        while (metrics.originalData.columns && groupNum < metrics.originalData.columns.length &&
            metrics.originalData.columns[groupNum].title) {
            groupNum++;
        }
        var res = [];
        metrics.originalData.results.forEach(row => {
            var title = row.slice(0, groupNum)[0];
            res.push(title);
        });

        let isLabelsDates = !res.map(item => !_.isNaN(Date.parse(item))).find(item => item === false);
        if (isLabelsDates) {
            res = res.map(item => moment(Date.parse(item)).format(Config.dateFormats.regular));
        }
        return res;
    }

    transformChart() {
        if (this.options.card.drill.isActive()) {
            return this.transformDrill();
        }

        if (['pie', 'donut'].indexOf(this.options.card.types.get()) >= 0) {
            return this.transformPie();
        } else {
            return this.transformRegularLine();
        }
    }

    transformDatatableLine() {

        var metric = this.options.metrics[0];
        var columns = [],
            columnsMap = this.options.columnsMap[metric.virtualId || metric.id];

        //TODO handle bigger datasets (right now limited to 100)
        var data = metric.getData().results.slice(0, 99).map((row) => {
            return {
                x: row[columnsMap[0]],
                y: row[columnsMap[1]]
            };
        });

        columns.push(data.map(function (item) {
            return item.x;
        }.bind(this)));
        columns[0].unshift('x');

        columns.push(data.map(function (item) {
            return item.y;
        }));
        columns[1].unshift(metric.label);
        return columns;
    }

    transformDatatablePie() {
        var metric = this.options.metrics[0];
        var columnsMap = this.options.columnsMap[metric.virtualId || metric.id];

        //TODO handle bigger datasets (right now limited to 100)
        var data = metric.getData().results.slice(0, 99).map(function (row) {
            return [row[columnsMap[0]], row[columnsMap[1]]];
        });

        return data;
    }

    transformRegularLine() {

        let columns = [];

        var visibleMetrics = this.options.metrics.filter((metric) => !metric.isHidden());

        visibleMetrics.forEach((metric) => {
            var metricData = [metric.label ? metric.label : metric.name];
            metric.getData().forEach((item) => metricData.push(item[1]));
            columns.push(metricData);
        });

        // when we receive data from BE all metrics have same length. This is a problem because if
        // one metric has no data for last month, instead of null it will have value of zero.
        columns = this.convertLeadingZerosToNull(columns);
        columns = this.convertTrailingZerosToNull(columns);

        if (this.options.xAxis.type == 'Date' && !this.options.card.drill.isTotal()) {
            let xAxis = this.getDateValues();
            xAxis.unshift('x');
            columns.unshift(xAxis);
        }
        // If we have only one data point we cannot display as a line so instead we will show single point
        this.options.showSinglePoint = this.showSinglePoint(angular.copy(columns));
        if (this.options.frequency === 'Total' && ['bar'].indexOf(this.options.type) > -1) {
            columns[0][1] = new Date().getTime();
        }
        return columns;
    }

    showSinglePoint(columns) {
        var showSinglePoint = false;
        var isLine = ['line', 'spline'].indexOf(this.options.type) > -1;
        if (columns.length > 1) {
            if (columns[1].filter(item => item != null).length == 2 && isLine) {
                showSinglePoint = true;
            }
        }
        return showSinglePoint;
    }

    /**
     * ['All - Forecast exc VAT', 0, 0, 0, 255, 322] will become ['All - Forecast exc VAT', null, null, null, 255, 322]
     */
    convertLeadingZerosToNull(columns) {
        return columns.map(column => {
            return column.map((item, index) => {
                if (_.isNumber(item)) {
                    if (item === 0 && (column[index + 1] === 0 || column[index - 1] === 0)) {
                        return null;
                    }
                }

                return item;
            });
        });
    }

    /**
     * ['All - Forecast exc VAT', 255, 322, 0, 0, 0] will become ['All - Forecast exc VAT', 255, 322, null, null, null]
     */
    convertTrailingZerosToNull(columns) {
        return this.convertLeadingZerosToNull(columns.slice().reverse()).reverse();
    }

    prepareMetrics() {
        var metrics;
        if (this.options.card) {
            metrics = this.options.card.metrics.getVisibleMetrics(this.options.card.metrics.getNonEmptyMetrics());

            if (this.options.card.groupings.length && !(this.options.card.drill.isCardDrill() && this.options.card.drill.isTotal())) {
                metrics = this.options.card.metrics.getMetricBasedData(metrics);
            }
        }
        else {
            metrics = this.options.metrics;
        }
        return metrics;
    }

    getDateValues() {
        if (!this.options.metrics.length) return [];
        var res;
        var metrics = this.prepareMetrics();

        var longestMetric = _.max(metrics, metric => metric.getData().length);
        let realMetric = metrics.find(metric => !metric.isComparable());
        var start = realMetric.getData()[0] ? realMetric.getData()[0][0] : realMetric.info.fromDate;
        start = moment(new Date(start));
        let shift = longestMetric.isComparable() ? start - moment(longestMetric.getData()[0][0]) : 0;
        res = longestMetric.getData().map(item => moment(new Date(item[0])) + shift);
        return res;
    }

    transformPie() {

        let data = {};
        let columns = [];
        let dateFormatFn = Helpers.formatDate(this.options.frequency, {isPieDonut: true, withYear: true});

        if (this.datatableTransformerFactory) data = this.datatableTransformerFactory.transform(this.options.card, false, dateFormatFn);

        if (this.options.frequency === 'Total') {
            if (data && data.metricData && data.metricData.columns && data.metricData.columns.length == 2) {
                // If we have groupings or anything similar aplied and we still have only 2 columns
                // we are able to display this data as a pie or donut chart so we do it
                if (data.metricData.results) {
                    data.metricData.results.forEach((result, index) => {
                        columns.push([result[0], result[1]]);
                    });
                }
            } else {
                var visibleMetrics = this.options.metrics.filter((metric) => !metric.isHidden());

                visibleMetrics.forEach((metric) => {
                    metric.getData().forEach((item) => columns.push([metric.label, item[1]]));
                });
            }
        } else {

            let datesLabel = data.metricData.columns;

            let dataResults = data.metricData.results;

            const numberOfGroupings = data.card.groupings.length;

            const indexShift = numberOfGroupings !== 0 ? numberOfGroupings : 1;

            datesLabel.forEach((label, labelIndex) => {
                if (labelIndex > indexShift - 1) {
                    dataResults.forEach((dataArray) => {

                        const pieLabel = _.clone(dataArray).slice(0, indexShift).join(', ') + ', ' + label;

                        const pieData = dataArray[labelIndex];

                        columns.push([pieLabel, +pieData]);
                    });
                }

            });
            if (numberOfGroupings > 0) {
                columns = this.getTopItemsWithOthers(columns);
            }
        }

        return columns;
    }

    getTopItemsWithOthers(columns) {
        if (columns.length > PIE_CHART_LIMIT) {
            let sorted = columns.sort((a, b) => {
                return a[1] - b[1];
            }).reverse(); // then reverse to get high to low
            let topItems = sorted.slice(0, PIE_CHART_LIMIT);
            let remaining = sorted.slice(PIE_CHART_LIMIT, sorted.length);
            let othersSum = _.sumBy(remaining, item => +item[1]);
            topItems.push(["Others", othersSum]);
            return topItems;
        } else {
            return columns;
        }
    }
}
