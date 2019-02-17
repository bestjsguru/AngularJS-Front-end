'use strict';

var Highcharts = require('highcharts');
require('highcharts/modules/drilldown')(Highcharts);

import HighchartData from './highchartData';
import HighchartConfig from './highchart.config';

export default class HighchartPieData extends HighchartData {
    constructor(card, chartOptions) {
        super(card);

        this.card = card;
        this.chartOptions = chartOptions;
        this.chartOptions.tooltip.crosshairs = false;
        this.chartOptions.tooltip.shared = false;

        this.frequency = this.card.frequencies.selected;

        this.pieOptions = {
            showInLegend: true,
            dataLabels: {
                enabled: true,
                formatter: function() {
                    return this.percentage > 5 ? (Math.round(this.percentage*100)/100).toFixed(0) + ' %' : '';
                },
                distance: -25,
                color:'white'
            }
        };
    
        if(card.chartSettings.getJson().valueLabels.show) {
    
            let self = this;
            this.pieOptions = {
                showInLegend: true,
                dataLabels: {
                    enabled: true,
                    formatter: function() {
                        let custom = (this.point && this.point.custom) || this.series.userOptions.custom;
    
                        let value = self.$filter('value')(
                            this.y,
                            custom.formatting.info,
                            false,
                            false,
                            custom.metric.numberOfDecimals
                        );
                        
                        let percentage = (Math.round(this.percentage*100)/100).toFixed(0) + '%';
    
                        return `${value}<br><span style="color:${this.color}; font-size: 9px;">(${percentage})</span>`;
                    },
                }
            };
        }
    }

    generate() {
        // on pie charts we show legends on the right side
        angular.extend(this.chartOptions.legend, {
            align: 'right',
            verticalAlign: 'middle',
            layout: 'vertical'
        });

        angular.extend(this.chartOptions.plotOptions, { pie: this.pieOptions });

        this.setData();
    }

    setData() {
        this.chartOptions.series = [];

        if(this.card.frequencies.isTotalSelected() || this.allMetricsHaveSingleValue()) {
            this.transformWithTotalFrequency();
        } else if (this.metrics.length === 1) {
            this.transformSingleMetric();
        } else {
            // multiple metrics in pie chart will be displayed as drilldown
            this.transformMultipleMetrics();
        }
    }

    transformData(metric) {
        return metric.getData().map((item) => {
            let date = HighchartConfig.date.format(item[0], this.frequency, {isPieDonut: true});
            let name = date;
            if(this.card.frequencies.isTotalSelected()) name = metric.label;
            else if(this.allMetricsHaveSingleValue()) name = `${metric.label}, ${date}`;
            
            let data = {
                name: name,
                y: item[1],
                color: metric.color,
                custom: {
                    value: item[0],
                    groupings: metric.groupings,
                }
            };
            
            return this.wrapWithFormattingInfo(data, metric);
        });
    }

    transformSingleMetric() {
        this.metrics.forEach((metric) => {
            let data = {
                name: metric.label,
                colorByPoint: true,
                data: this.transformData(metric),
                custom: {
                    groupings: metric.groupings
                },
            };

            this.wrapWithFormattingInfo(data, metric);

            this.chartOptions.series.push(data);
        });
    }

    transformMultipleMetrics() {

        let drillName = 'Metrics';
        let drillSubtitle = 'Click the slices to view individual metric data.';
        this.chartOptions.subtitle.text = drillSubtitle;

        this.chartOptions.series.push({
            name: drillName,
            colorByPoint: true,
            data: [],
            tooltip: {
                headerFormat: '',
                pointFormat: '<span style="color:{point.color}">\u25CF</span> {point.name}</b><br/>',
            },
            dataLabels: {
                enabled: false,
            }
        });

        angular.extend(this.chartOptions.chart.events, {
            drilldown: function(e){
                let chart = this;
                chart.setTitle({text: e.point.name}, {text: ''});

            },
            drillup: function(e){
                let chart = this;
                if(e.seriesOptions.name == drillName) {
                    chart.setTitle({text: ''}, {text: drillSubtitle});
                }
                else {
                    chart.setTitle({text: e.seriesOptions.name}, {text: ''});
                }
            }
        });

        // This is required to make space for cases when there is huge number of legend items
        // and it is bigger in hight than chart itself so it overlaps with title and subtitle
        angular.extend(this.chartOptions.legend, { y: 50 });
        angular.extend(this.chartOptions.chart, { spacingBottom: 70 });

        this.metrics.forEach((metric) => {
            this.chartOptions.series[0].data.push({
                name: metric.label,
                y: parseInt(100 / this.metrics.length),
                drilldown: metric.label,
                color: metric.color
            });

            let data = {
                name: metric.label,
                id: metric.label,
                data: this.transformData(metric),
                custom: {
                    groupings: metric.groupings
                }
            };

            this.wrapWithFormattingInfo(data, metric);
            this.wrapWithTooltipFormatting(data);

            this.chartOptions.drilldown.series.push(data);
        });
    }

    allMetricsHaveSingleValue() {
        return this.metrics.reduce((allHaveSingleValue, metric) => {
            return metric.getData().length === 1;
        }, true);
    }

    transformWithTotalFrequency() {
        let data = {
            name: 'Total',
            colorByPoint: true,
            data: this.metrics.reduce((data, metric) => {
                return [...data, ...this.transformData(metric)];
            }, [])
        };

        this.metrics.length && this.wrapWithFormattingInfo(data, this.metrics[0]);
        
        this.wrapWithTooltipFormatting(data);
        
        this.chartOptions.series.push(data);
    }
    
    wrapWithTooltipFormatting(data) {
        let self = this;
        data.tooltip = data.tooltip || {};
        data.tooltip.pointFormatter = function() {
            let custom = (this.options && this.options.custom) || this.series.userOptions.custom;
        
            let value = self.$filter('value')(
                this.y,
                custom.formatting.info,
                false,
                false,
                custom.metric.numberOfDecimals
            );
        
            return `<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> ${this.series.name}: <b>${value}</b><br/>`;
        };
    }
}
