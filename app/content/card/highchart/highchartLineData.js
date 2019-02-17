'use strict';

var Highcharts = require('highcharts');

import HighchartData from './highchartData';
import HighchartConfig from './highchart.config';
import {Helpers} from '../../common/helpers';

export default class HighchartLineData extends HighchartData {
    constructor(card, chartOptions) {
        super(card);

        this.card = card;
        this.chartOptions = chartOptions;
        this.useTooltipSymbols = true;
    
        let self = this;
    
        if(card.chartSettings.getJson().valueLabels.show) {
            angular.extend(this.chartOptions.plotOptions.series, {
                dataLabels: {
                    enabled: true,
                    color: Highcharts.theme && Highcharts.theme.dataLabelsColor || '#6F6F6F',
                    formatter: function() {
                        let custom = (this.point && this.point.custom) || this.series.userOptions.custom;
    
                        return self.$filter('value')(
                            this.y,
                            custom.formatting.info,
                            false,
                            false,
                            custom.metric.numberOfDecimals
                        );
                    }
                }
            });
        }
    }

    generate() {
        this.setData();
        this.setTwoAxis(); // Must be after this.setData()
        this.convertForAnomalies();
        this.convertSingleValueToPoint();

        if(this.hasOnlySingleValueMetrics() && !this.card.groupings.length) {
            this.convertForSingleValueOrTotalFrequency();
        } else {
            this.convertForGroupingsWithTotalFrequency();
        }
    
        if(!this.card.chartSettings.getJson().fillChart) {
            this.chartOptions.plotOptions.series.lineWidth = 3;
        }
    
        this.convertToStackedChart();
        
        this.chartOptions.plotOptions.series.marker.enabled = true;
        this.chartOptions.plotOptions.series.marker.radius = 0;
        this.chartOptions.plotOptions.series.marker.states = {
            hover: {
                radius: HighchartConfig.marker.radius,
            }
        };
    }
    
    convertToStackedChart() {
        if(!this.card.chartSettings.getJson().stacked) return;
    
        angular.extend(this.chartOptions.plotOptions, {
            bar: {stacking: 'normal'},
            column: {stacking: 'normal'},
            line: {stacking: 'normal'},
            area: {stacking: 'normal'},
            spline: {stacking: 'normal'},
            areaspline: {stacking: 'normal'},
        });
    
        let self = this;
    
        if(!this.card.chartSettings.getJson().spider.enabled) {
            if(this.card.chartSettings.getJson().valueLabels.show) {
                this.chartOptions.yAxis.forEach(axis => {
                    axis.stackLabels = {
                        enabled: true,
                        style: {
                            color: Highcharts.theme && Highcharts.theme.dataLabelsColor || '#6F6F6F',
                        },
                        formatter: function() {
                            let info = null;
                            let formatting = self.getSerieFormatting(this.axis.series.map(serie => serie.userOptions || {}));
                        
                            if(formatting) info = formatting.info;
                        
                            return self.$filter('value')(this.total, info, false);
                        }
                    };
                });
            }
        
            angular.extend(this.chartOptions.plotOptions.series, {
                dataLabels: {
                    enabled: false,
                }
            });
        }
    
        this.chartOptions.series.forEach(serie => {
            serie.stack = serie.yAxis;
        });
    }

    setTwoAxis() {

        if(!this.chartOptions.series.length) return;

        let leftAxisItems = [];
        let rightAxisItems = [];
    
        this.chartOptions.yAxis[0].visible = this.card.chartSettings.hasMetricsOnLeftYAxis();
        this.chartOptions.yAxis[1].visible = this.card.chartSettings.hasMetricsOnRightYAxis();
    
        this.chartOptions.series.forEach((serie, index) => {
            if(this.card.chartSettings.metricIsOnLeftYAxis(serie.custom.metric.id)) {
                leftAxisItems.push({value: serie, colorIndex: index});
            } else if(this.card.chartSettings.metricIsOnRightYAxis(serie.custom.metric.id)) {
                rightAxisItems.push({value: serie, colorIndex: index});
            } else {
                leftAxisItems.push({value: serie, colorIndex: index});
            }
        });

        this.formatLeftAxis(leftAxisItems);
        this.formatRightAxis(rightAxisItems);
    }

    formatLeftAxis(items) {
        let thresholdReached = this.chartOptions.series.length > HighchartConfig.twoAxis.titles.threshold;
        this.setAxisFormatting(this.chartOptions.yAxis[0], items);

        items.forEach((serie, index) => {
            serie.value.yAxis = 0;
            
            if(!serie.value.name.startsWith(HighchartConfig.trendLine.legendPrefix)) {
                !thresholdReached && this.card.chartSettings.getJson().leftYAxis.autoLabel && this.addAxisTitle(this.chartOptions.yAxis[0], serie, index);
            }
        });
    }

    formatRightAxis(items) {
        let thresholdReached = this.chartOptions.series.length > HighchartConfig.twoAxis.titles.threshold;
        this.setAxisFormatting(this.chartOptions.yAxis[1], items);

        items.forEach((serie, index) => {
            serie.value.yAxis = 1;
            
            if(!serie.value.name.startsWith(HighchartConfig.trendLine.legendPrefix)) {
                !thresholdReached && this.card.chartSettings.getJson().rightYAxis.autoLabel && this.addAxisTitle(this.chartOptions.yAxis[1], serie, index);
            }
        });
    }

    addAxisTitle(yAxis, serie, index) {
        
        // Reset axis title first time we call this method
        if(index === 0) yAxis.title = {
            text: '',
            margin: -7,
        };
        
        let color = serie.value.color || Highcharts.getOptions().colors[serie.colorIndex];
        yAxis.title.text += `<span style="color: ${color};">${serie.value.name}</span><br>`;
        yAxis.title.margin = yAxis.title.margin += [20, 10, 3][index] || 3;
    }

    setAxisFormatting(yAxis, items) {
        let formatting = this.getAxisFormatting(items);
        yAxis.labels = {enabled: yAxis.labels.enabled};
    
        if(formatting.info) {
            yAxis.labels.formatter = function () {
                if(formatting.info.type === 'time') {
                    return Helpers.toHHMMSS(this.value);
                }
                
                let label = this.axis.defaultLabelFormatter.call(this);
    
                if(formatting.info.symbol === '123') formatting.info.symbol = '';
                
                return formatting.prefix ? formatting.info.symbol + label : label + formatting.info.symbol;
            };
        }
    }

    getAxisFormatting(items) {
        // Only if all metrics have same formatting we will display that format on axis
        return this.getSerieFormatting(items.map(item => item.value)) || {};
    }
    
    getSerieFormatting(series) {
        let formatting = false;
    
        series.filter(serie => serie.custom).some(serie => {
            if(!formatting) formatting = _.clone(serie.custom.formatting);
        
            if(JSON.stringify(formatting) !== JSON.stringify(serie.custom.formatting)) {
                formatting = false;
                return true;
            }
        });
        
        return formatting;
    }
    
    getSerieMetric(series) {
        let metric = false;
        
        series.filter(serie => serie.custom).some(serie => {
            if(!metric) metric = _.clone(serie.custom.metric);
        
            if(JSON.stringify(metric) !== JSON.stringify(serie.custom.metric)) {
                metric = false;
                return true;
            }
        });
        
        return metric;
    }

    setData() {
        this.chartOptions.series = this.transformData();
    }

    transformData() {

        let columns = [];
    
        this.metrics.forEach((metric, index) => {

            let data = {
                name: metric.label,
                data: metric.getData(),
                color: metric.color || Highcharts.getOptions().colors[index],
                zIndex: this.metrics.length - this.card.columnPosition.findMetricIndex(metric),
                pointPlacement: this.card.chartSettings.getJson().spider.enabled ? 'on' : null,
                custom: {
                    groupings: metric.groupings
                },
            };
    
            let self = this;
            if(this.useTooltipSymbols) {
                data.tooltip = data.tooltip || {};
                data.tooltip.pointFormatter = function() {
                    let custom = (this.point && this.point.custom) || this.series.userOptions.custom;
                    
                    let value = self.$filter('value')(
                        this.y,
                        custom.formatting.info,
                        false,
                        false,
                        custom.metric.numberOfDecimals
                    );
        
                    return `<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[index%5]}</span> ${this.series.name}: <b>${value}</b><br/>`;
                }
            }

            // Make sure data is sorted in ascending order but only if we have dates to sort by
            // in case of total frequency we won't have dates and they will be undefined
            if(data.data.every(value => value[0] !== undefined)) {
                
                // We need to remove horizontal total numbers from charts as they are only applicable to tables
                // Instead of timestamp keys they will have string value keys that are equal to 'TOTAL'
                data.data = data.data.filter(value => _.toLower(value[0]) !== 'total');
                
                // And now we can safely sort the rest of the data
                data.data = data.data.sort((a, b) => a[0] - b[0]);
            }

            columns.push(this.wrapWithFormattingInfo(data, metric));
        });

        return columns;
    }

    convertForSingleValueOrTotalFrequency() {

        let name = 'Total';
        if(!this.card.frequencies.isTotalSelected()) {
            let dateFormatter = Helpers.formatDate(this.card.frequencies.selected);
            let date = this.chartOptions.series.reduce((date, serie) => serie.data[this.getSingleValueIndex(serie)][0], null);

            name = dateFormatter(date);
        }

        // In case of Total frequency or single value chart like "yearly - this year" we don't want to
        // display datetime on xAxis. Instead, we will just display plain text
        this.chartOptions.legend.enabled = false;

        let data = this.chartOptions.series.reduce((data, serie, index) => {
            data.push({
                name: serie.name,
                y: serie.data[this.getSingleValueIndex(serie)][1],
                color: Highcharts.getOptions().colors[
                    this.groupingSets.reduce((index, set, setIndex) => {
                        return serie.name.includes(set) ? setIndex : index;
                    }, index)
                ],
                custom: {
                    value: serie.data[this.getSingleValueIndex(serie)][0],
                }
            });

            return data;
        }, []);
    
        // Set custom metric color if needed
        data.map((serie) => {
            let metric = this.card.metrics.find(item => item.label === serie.name);
            
            if(metric) {
                serie = this.wrapWithFormattingInfo(serie, metric);
                
                if(metric.color) serie.color = metric.color;
            }
            
            return serie;
        });
        
        data.sort((a, b) => b.y - a.y);
    
        this.chartOptions.xAxis.categories = data.reduce((categories, item) => {
            categories.push(item.name);
        
            return categories;
        }, []);
    
        let self = this;
        this.chartOptions.series = [{
            name: name,
            data: data,
            custom: {
                formatting: this.getSerieFormatting(this.chartOptions.series),
                metric: this.getSerieMetric(this.chartOptions.series),
            },
            tooltip: {
                pointFormatter: function() {
                    let value = self.$filter('value')(
                        this.y,
                        this.custom.formatting.info,
                        false,
                        false,
                        this.custom.metric.numberOfDecimals
                    );
    
                    return `<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> ${this.series.name}: <b>${value}</b><br/>`;
                }
            },
        }];
    }

    convertForAnomalies() {
        if(!this.card.anomalies) return;
        this.chartOptions.legend.enabled = false;
        this.chartOptions.plotOptions.series.marker.enabled = true;

        this.chartOptions.series.forEach(serie => {
            serie.data = serie.data.map(value => {
                let anomaly = this.card.anomalies.find(anomaly => +anomaly.data === +value[0]);

                if(anomaly) {
                    return {
                        marker: {
                            radius: HighchartConfig.marker.radius,
                            fillColor: anomaly.isGood ? HighchartConfig.colors.green : HighchartConfig.colors.red,
                            lineWidth: 0.5,
                            lineColor: anomaly.isGood ? HighchartConfig.colors.green : HighchartConfig.colors.red,
                        },
                        x: value[0],
                        y: value[1]
                    };
                }

                return {
                    marker: { radius: 0 },
                    x: value[0],
                    y: value[1]
                };
            });
        });
    }

    convertSingleValueToPoint() {
        this.chartOptions.series.forEach(serie => {
            serie.marker = { radius: 0 };
            // Only in case we have single chart value we display dots on lines
            if(serie.data.filter(item => item[1] !== null).length === 1) {
                serie.marker = { radius: HighchartConfig.marker.radius };
            }
        });
    }

    hasOnlySingleValueMetrics() {
        return this.chartOptions.series.reduce((maxDataLength, serie) => {
            return Math.max(maxDataLength, serie.data.filter(item => item[1] !== null).length);
        }, 0) === 1;
    }
    
    getSingleValueIndex(serie) {
        let index = serie.data.findIndex(item => item[1] !== null);
        
        // If there is no value other then null we return first index
        return index === -1 ? 0 : index;
    }
    
    convertForGroupingsWithTotalFrequency() {
        if(this.card.groupings.length && this.card.frequencies.isTotalSelected()) {
            this.chartOptions.xAxis.categories = this.groupingCategories;
        }
    }
}
