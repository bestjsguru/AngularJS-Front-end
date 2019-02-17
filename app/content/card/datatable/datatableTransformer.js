'use strict';
import {Helpers} from '../../common/helpers.js';
import {DataTransformer} from '../chart/dataTransform.js';
import {ColumnHelper} from './column.helper';

import {DatatableCellModel} from './datatableCompareCell.model.js';

const LONG_TABLE_COLUMNS = 7;

class DatatableTransformer {

    constructor($filter, card, formatNumbers, dateFormatFn, DateRangeService) {
        this.card = card;
        this.formatNumbers = formatNumbers;
        this.$filter = $filter;
        this.DateRangeService = DateRangeService;
        this.frequency = this.card.frequencies.selected;
        this.formatFn = (a) => a;
        this.dateFormatFn = dateFormatFn ? dateFormatFn : Helpers.formatDate(this.frequency, {withYear: true, isTable: true});
        this.multiheader = false;
        this.longTable = false;
        this.groupColumnsNum = 0;
        this.topHeaders = [];
        this.metricData = {};
        /**
         * for each column in result data contains it's index in original data
         * @type {Array}
         */
        this.originalIdxColumnsMap = [];

        var metrics = this.card.metrics;
        this.dataTransform = new DataTransformer({
            metrics: metrics.getVisibleMetrics(metrics.getNonEmptyMetrics())
        }, this);

        this.init();
    }

    init() {

        this.metric = this.card.metrics.get(0) || false;
        if (this.metric && this.metric.getXAxisInfo().type == 'Date') this.formatFn = this.dateFormatFn;

        this.metricData = this.metric ? angular.copy(this.metric.getData()) : {};

        if (this.card.metrics.length > 1 && this.card.frequencies.isTotalSelected() && !this.card.groupings.length) {
            this.metricData = {
                columns: ['Metric', 'Sum'],
                results: this.getSortedMetrics(this.card.metrics.originalData).filter(metric => {
                    return !metric.isHidden();
                }).map(metric => [
                    metric.label,
                    this.getValueFromMetric(metric),
                ]),
            };
        } else if (this.card && this.card.metrics && this.card.metrics.originalData &&
            this.card.metrics.originalData.results && this.card.metrics.originalData.results.length >= 1) {
            this.prepareRawData(this.card.metrics.originalData);
        } else if (this.metric && !this.metricData.columns) {
            this.metricData.columns = ['Value', 'Time'];
            if (!this.frequency) this.frequency = 'Monthly';

            this.metricData.results = this.metricData.map((item) => {
                return [item[1].toFixed(2), this.formatFn(item[0])];
            });
        }

        this.columnsSort = this.card.columnsSort || [];

        this.longTable = this.metricData.columns.length > LONG_TABLE_COLUMNS;

    }

    /** @private **/
    getValueFromMetric(metric, needFormat = this.formatNumbers){
        const value = _.result(metric.data, '[0][1]', 0);
        const info = metric.getFormattingInfo();

        return needFormat ? this.$filter('value')(value, info, false, false, metric.numberOfDecimals) : value;
    }

    /** @private
     * this function used to prepare data for the non-interval case,
     * when we have  groupings enabled and frequency set to `Total`*/
    prepareGroupingsAndTotalData(data) {
        this.originalIdxColumnsMap.length = 0;
        this.metricData.columns = data.columns.reduce((res, col, idx) => {
            if (col.title) {
                res.push(col.title);
                this.originalIdxColumnsMap.push(idx);
            } else {
                var metric = this.card.metrics.getByColumnDesc(col);
                if (metric && !metric.isHidden()) {
                    res.push(metric.label);
                    this.originalIdxColumnsMap.push(idx);
                }
            }
            return res;
        }, []);
        this.metricData.results = this.getGroupingResults(data);
    }


    /** @private */
    prepareGroupingsData(data) {
        let currentRange = this.DateRangeService.createByName(this.card.rangeName, this.card.fromDate, this.card.toDate);

        data = {
            columns: data.columns.slice(),
            results: data.results.map(row => row.slice())
        };

        //move comparable data to correct place in table
        //to match regular data range
        this.card.metrics.forEach((metric, idx) => {
            if (!metric.isComparable()) return;
            var range = this.DateRangeService
                .createByName(metric.getRangeName(), metric.info.fromDate, metric.info.toDate, this.DateRangeService.getCompareRanges());

            var dates = this.DateRangeService.getCompareDates(currentRange, range);
            var startComp = dates.start.hours(0).minutes(0).seconds(0);
            var firstComp = this.groupColumnsNum + idx;
            while (data.columns[firstComp] && data.columns[firstComp].time < startComp) firstComp += this.card.metrics.length;
            var diff = this.groupColumnsNum - firstComp + idx;
            while (firstComp + diff < data.columns.length && firstComp < this.groupColumnsNum) {
                data.results.forEach(row => {
                    row[firstComp + diff] = row[firstComp];
                });
                firstComp += this.card.metrics.length;
            }
        });

        var metric;
        this.multiheader = this.card.metrics.getVisibleCount() > 1;

        this.topHeaders = [];

        this.metricData.columns = [];
        this.originalIdxColumnsMap.length = 0;
        
        for (var i = 0; i < data.columns.length; i++) {
            var col = data.columns[i];

            if (col.title) {
                this.metricData.columns.push(col.title);
                this.originalIdxColumnsMap.push(i);
                this.multiheader && this.topHeaders.push('');
            } else {
                metric = this.card.metrics.getByColumnDesc(col);
                if (!metric || metric.isHidden()) continue;

                if (this.multiheader && this.topHeaders.indexOf(this.dateFormatFn(col.time)) == -1) {
                    this.topHeaders.push(this.dateFormatFn(col.time));
                }

                if (this.multiheader) {
                    this.metricData.columns.push(metric.label);
                } else {
                    this.metricData.columns.push(this.dateFormatFn(col.time));
                }

                this.originalIdxColumnsMap.push(i);
            }
        }
    
        this.metricData.results = this.getGroupingResults(data);
    }

    /** @private */
    getGroupingResults(data) {
        
        return data.results.map((row) => {
            let newRow = row.slice(0);

            for (let i = 0; i < newRow.length; i++) {
                let metric = this.card.metrics.getByColumnDesc(data.columns[i]);
                if (!metric || metric.isHidden()) continue;

                let comparableValue = false;
                if(metric.isComparable()){
                    // In order to get correct comparable value we have to find
                    // table index of original metric that is being compared
                    let index = this.card.columnPosition.findMetricIndex(this.card.compare.getRelatedMetric(metric));
                    
                    if(this.card.metrics.getVisibleCount() > 1 && !this.card.frequencies.isTotalSelected()) {
                        index = this.card.columnPosition.findMultiheaderMetricIndex(this.card.compare.getRelatedMetric(metric));
                    }
                    
                    comparableValue = row[index];
                }
    
                newRow[i] = this.getComparableGroupingItem(row[i], comparableValue, metric);
            }
            
            return newRow;
        });
    }

    getComparableGroupingItem(value, compareValue, metric) {
        let info = metric.getFormattingInfo();
        
        let formatter = (value) => {
            return this.$filter('value')(value, info, false, false, metric.numberOfDecimals);
        };

        if (!compareValue) {
            return this.formatNumbers ? formatter(value) : value;
        } else {
            return new DatatableCellModel(compareValue, value, formatter);
        }
    }

    /** @private */
    updateGroupingColumnsNum(data) {
        this.groupColumnsNum = data.columns.filter(item => item.title).length;
    }

    /** @private */
    prepareRawData(data) {
        // TODO all that function is hackish and should be done in different way completely
        // for now it skips half of our app and uses direct BE response's raw data.

        // Reset header data
        this.multiheader = false;

        if (this.card.frequencies.isGrainSelected()) {
            this.prepareGrainData(data);
        } else if (this.card.groupings.length) {

            this.updateGroupingColumnsNum(data);

            if (this.card.frequencies.isTotalSelected()) {
                this.prepareGroupingsAndTotalData(data);
            } else {
                this.prepareGroupingsData(data);
            }
        } else {
            this.prepareRegularData(data);
        }
    }

    prepareGrainData(data) {
        this.metricData.columns = [];
        let columnsFormatFn = [];
        
        data.columns.forEach(col => {
            this.metricData.columns.push(col.title);
            
            if (ColumnHelper.isDateType(col.type)) {
                columnsFormatFn.push(this.dateFormatFn);
            } else if (ColumnHelper.isNumberType(col.type)) {
                columnsFormatFn.push((value) => this.$filter('value')(value, {}, false, false));
            } else {
                columnsFormatFn.push((v) => v);
            }
        });

        // And format result values
        this.metricData.results = data.results.map(row => row.map((val, idx) => {
            return columnsFormatFn[idx](val);
        }, []));
    }

    isFirstColumnDate() {
        return !this.metricData.columns.length && this.card.metrics.length &&
               this.card.metrics.get(0).getDateFieldIndex() === 0 && this.card.metrics.get(0).info.dateColumn;
    }

    prepareRegularData(data) {

        var metricColumnIndexCounter = 0;
        var columnsVisibility = [];
        var columnsFormatFn = [];
        this.metricData.columns = [];
        const visibleMetrics = this.card.metrics.getVisibleMetrics();

        // test to see if the first column is a date
        if (this.isFirstColumnDate()) {
            this.metricData.columns.push('Date');
            columnsVisibility.push(true);
            columnsFormatFn.push(this.dateFormatFn);
            metricColumnIndexCounter++;
        }
    
        let metrics = this.getSortedMetrics(data);
        
        let isComparableInCard = !!metrics.find(metric => metric.isComparable());
        metrics.forEach(metric => {
            let info = metric.getFormattingInfo();

            // hack for comparable
            if (isComparableInCard && metric.columns && metric.columns.length > 2) {
                metric.columns = [{title : 'Date'}, {title: metric.name}];
            }

            metric.columns.forEach((column, index) => {
                if (index === 0 && column.title == 'Date') return;
                if (metric.getDateFieldIndex() == metricColumnIndexCounter && metric.info.dateColumn) {
                    // Format value as a date
                    columnsFormatFn.push(this.dateFormatFn);
                } else {
                    // Format numeric value, and leave all non-numeric values same
                    columnsFormatFn.push(value => {
                        if (Helpers.shouldBeFormatedAsDate(value, column.title)) return this.dateFormatFn(value);
                        if (Helpers.shouldBeFormatedAsNumeric(value, column.title) && this.formatNumbers) {
                            return this.$filter('value')(value, info, false, false, metric.numberOfDecimals);
                        }
                        return value;
                    });
                }

                // There are cases where columns are objects that contain relationIds, etc.
                // And in that cases we just dont show them and make that columns hidden
                // TODO I dont like that I had to do this, so if anyone has better solution feel free to fix ;)
                if (typeof column.title === 'string' && column.title != 'Date') {
                    this.metricData.columns.push(column.title);
                    columnsVisibility.push(!metric.isHidden());
                    metricColumnIndexCounter++;
                }

            });
        });

        // Remove hidden metric columns
        this.metricData.columns = this.metricData.columns.reduce((res, col, idx) => {
            if (columnsVisibility[idx]) res.push(col);
            return res;
        }, []);

        let results = data.results.slice();

        if (isComparableInCard) {
            results.forEach((rowItem, rowIndex) => {
                rowItem.forEach((cellItem, cellIndex) => {
                    if (cellIndex > 0) {
                        let currentMetric = this.card.metrics.getByColumnDesc(data.columns[cellIndex]);
                        
                        if (currentMetric && currentMetric.isComparable()) {
                            results[rowIndex][cellIndex] = this.getComparableData(currentMetric, rowIndex)[1];
                        }
                    }
                });
            });
        }

        // And format result values
        
        // results.map(item => item.filter(n => true)) - will drop 'undefined' from each row like this
        // from [1474844400000, 21865.86, undefined, undefined, undefined, 27.28] to [1474844400000, 21865.86, 27.28]
        this.metricData.results = this.formatValues(results.map(item => item.filter(n => true)), columnsFormatFn);
    }
    
    getSortedMetrics(data) {
        let metrics = data.columns.reduce((metrics, column) => {
            if(!column.title) {
                let metric = this.card.metrics.getByColumnDesc(column);
            
                if(metric) metrics.push(metric);
            }
        
            return metrics;
        }, []);
    
        // For custom SQL metrics we don't have metrics inside columns array so we have to handle differently.
        if(this.card.isCustomSQL()) {
            metrics = ColumnHelper.sortedMetrics(this.card.metrics.getVisibleMetrics());
        }
        return metrics;
    }

    formatValues(results, columnsFormatFn) {
        return results.map(row => row.reduce((res, val, idx) => {
            if (val && val.comparableValue !== undefined) {
                res.push(new DatatableCellModel(val.metricValue, val.comparableValue, columnsFormatFn[idx]));
            }
            else {
                columnsFormatFn[idx] && res.push(columnsFormatFn[idx](val));
            }
            return res;
        }, []));
    }

    getColumnOriginalIdx(idx) {
        if (!this.originalIdxColumnsMap.length) return idx;
        return this.originalIdxColumnsMap[idx];
    }

    getComparableData(compareMetric, idx) {
        let metric = this.card.compare.getRelatedMetric(compareMetric);
        let comparableValue = compareMetric.data[idx] ? compareMetric.data[idx][1] : '';

        let value = metric.data.length
            ? {
                comparableValue: comparableValue,
                metricValue: metric.data[idx][1]
            }
            : comparableValue;

        return ['', value];
    }
}

truedashApp.service('datatableTransformerFactory', ($filter, DateRangeService) => ({
    transform: (card, formatNumbers = true,
                dateFormatFn = undefined) => new DatatableTransformer($filter, card, formatNumbers, dateFormatFn, DateRangeService)
}));
