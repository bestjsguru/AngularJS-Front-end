'use strict';

import GroupingTransformer from './groupingTransformer';

var Highcharts = require('highcharts');
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/offline-exporting')(Highcharts);
require('../../nonBower/highcharts-regression/highcharts-regression')(Highcharts);
require('highcharts-custom-events')(Highcharts);

import HighchartConfig from './highchart.config';
import HighchartCardType from './highchartCardType';
import HighchartArearangeData from './highchartArearangeData';
import HighchartScatterData from './highchartScatterData';
import HighchartBubbleData from './highchartBubbleData';
import HighchartSankeyData from './highchartSankeyData';
import HighchartLineData from './highchartLineData';
import HighchartSunburstData from './highchartSunburstData';
import HighchartTreemapData from './highchartTreemapData';
import HighchartBulletData from './highchartBulletData';
import HighchartBarData from './highchartBarData';
import HighchartSymbolData from './highchartSymbolData';
import HighchartGaugeData from './highchartGaugeData';
import HighchartPieData from './highchartPieData';
import HighchartDonutData from './highchartDonutData';
import HighchartMixedData from './highchartMixedData';
import HighchartFunnelData from './highchartFunnelData';
import {EventEmitter} from '../../system/events.js';

class HighchartWrapperService extends EventEmitter {
    constructor($rootScope, CacheService) {
        super();

        this.$rootScope = $rootScope;
        this.CacheService = CacheService;
    }

    setDefaultOptions() {
        // Set default highcharts options
        let userTimezoneOffset = moment().utcOffset();
    
        let dashboardColors = window.dashboard && window.dashboard.theme.useCustomTheme && window.dashboard.theme.colors.chart;
        let colors = this.CacheService.get('highchart.colors', dashboardColors || window.Auth.user.organisation.theme.colors.chart);
        
        Highcharts.setOptions({
            colors: _.clone(colors),
            credits: {enabled: false},
            lang: {thousandsSep: ','},
            plotOptions: {
                series: {
                    animation: !window.Location.isPhantom
                }
            },
            global: {
                // We need to convert offset to be opposite value. If we have negative offset we convert to positive and vice versa.
                timezoneOffset: userTimezoneOffset < 0 ? Math.abs(userTimezoneOffset) : -Math.abs(userTimezoneOffset)
            }
        });
    
        Highcharts.dateFormats = {
            Q: function (timestamp) {
                let date = new Date(timestamp);
                
                return moment(date).format('[Q]Q');
            }
        };
    }

    create(options) {
        this.setDefaultOptions();

        let self = this;

        this.card = options.card;
        this.element = options.element;

        this.options = {
            chart: {
                renderTo: this.element,
                backgroundColor: 'transparent',
                events: {
                    load: function() {
                        self.resetYAxisRange(this);
                        self.setYAxisRange(this);
                    },
                },
                zoomType: 'xy',
                polar: this.card.chartSettings.getJson().spider.enabled,
            },
            exporting: {
                enabled: false,
                fallbackToExportServer: true,
            },
            legend: {
                enabled: this.card.chartSettings.getJson().legend.show,
            },
            title: { text: '' },
            subtitle: { text: '' },
            xAxis: {
                lineWidth: this.card.chartSettings.getJson().spider.enabled ? 0 : 1,
                gridLineWidth: this.card.chartSettings.getJson().spider.enabled ? 1 : 0,
                tickColor: 'transparent',
                tickmarkPlacement: this.card.chartSettings.getJson().spider.enabled ? 'on' : 'between',
                title: this.card.chartSettings.getJson().xAxis.label ? {
                    text: this.card.chartSettings.getJson().xAxis.label
                } : false,
                type: 'datetime',
                dateTimeLabelFormats: {
                    // these overrides are necessary because when we have single value on chart highchart
                    // renders date in millisecond format so we will just give it current frequency
                    // format so in case of yearly frequency it will show only year number
                    millisecond: this.card.frequencies.getFrequencyDateFormat(),
                    second: this.card.frequencies.getFrequencyDateFormat(),
                    minute: this.card.frequencies.getFrequencyDateFormat(),
                    month: this.card.frequencies.getFrequencyDateFormat()
                },
                visible: true,
                lineColor: this.card.chartSettings.getJson().xAxis.show ? '#ccd6eb' : 'transparent',
                labels: {
                    enabled: this.card.chartSettings.getJson().xAxis.show,
                },
            },
            yAxis: [
                {
                    title: this.card.chartSettings.getJson().leftYAxis.label ? {
                        text: this.card.chartSettings.getJson().leftYAxis.label
                    } : false,
                    lineWidth: this.card.chartSettings.getJson().spider.enabled ? 0 : 1,
                    gridLineWidth: this.card.chartSettings.getJson().spider.enabled ? 1 : 0,
                    startOnTick: this.card.chartSettings.getJson().spider.enabled ? true : false,
                    tickColor: 'transparent',
                    visible: true,
                    gridLineInterpolation: this.card.chartSettings.getJson().spider.type,
                    lineColor: this.card.chartSettings.isLeftYAxisVisible() ? '#ccd6eb' : 'transparent',
                    labels: {
                        enabled: this.card.chartSettings.isLeftYAxisVisible(),
                    },
                    angle: 0,
                }, {
                    title: this.card.chartSettings.getJson().rightYAxis.label ? {
                        text: this.card.chartSettings.getJson().rightYAxis.label
                    } : false,
                    lineWidth: this.card.chartSettings.getJson().spider.enabled ? 0 : 1,
                    gridLineWidth: this.card.chartSettings.getJson().spider.enabled ? 1 : 0,
                    startOnTick: this.card.chartSettings.getJson().spider.enabled ? true : false,
                    tickColor: 'transparent',
                    opposite: true,
                    visible: true,
                    gridLineInterpolation: this.card.chartSettings.getJson().spider.type,
                    lineColor: this.card.chartSettings.isRightYAxisVisible() ? '#ccd6eb' : 'transparent',
                    labels: {
                        enabled: this.card.chartSettings.isRightYAxisVisible(),
                    },
                    angle: this.card.chartSettings.getJson().spider.enabled ? 90 : 0,
                }
            ],
            tooltip: {
                crosshairs: true,
                shared: true,
                outside: true,
                valueDecimals: 2,
                xDateFormat: this.card.frequencies.getTooltipFrequencyDateFormat(),
            },
            plotOptions: {
                series: {
                    groupPadding: 0.08,
                    fillOpacity: 0.25,
                    connectNulls: true,
                    marker: {
                        enabled: false
                    },
                    dataLabels: {
                        style: {
                            textOutline: false
                        }
                    },
                    point: {
                        events: {
                            mouseOver: function() {
                                // We don't want to trigger this event for drilldown charts.
                                // However it will be triggered once drilled down to single data
                                if(this.drilldown) return;
                                self.$rootScope.$broadcast('highchart.point.mouseover', this);
                            },
                            click: function() {
                                // We don't want to trigger this event for drilldown charts.
                                // However it will be triggered once drilled down to single data
                                if(this.drilldown) return;
                                self.$rootScope.$broadcast('highchart.point.click', this);
                            },
                            contextmenu: function (event) {
                                if(self.card.isInDrillMode()) {
                                    let custom = this.custom || (this.point && this.point.custom) || this.series.userOptions.custom;
                                    let params = {
                                        value: _.get(custom, 'value', (this.category || this.name)),
                                        position: {left: event.chartX, top: event.chartY},
                                        metric: custom.metric,
                                    };
    
                                    if(!self.card.frequencies.isTotalSelected() || ['pie', 'donut', 'funnel'].includes(self.card.types.get())) {
                                        params.groupings = _.get(custom, 'groupings', []);
                                    } else {
                                        // This has to be done differently for cards with total frequency and groupings applied
                                        // Solution from above cannot work properly if you have multiple groupings applied
                                        params.groupings = (new GroupingTransformer(self.card)).getDataPointGroupings(this.index);
                                    }
                                    
                                    self.card.drill.trigger('showDropdown', params);
                                    
                                }
                            }
                        }
                    },
                    events: {
                        mouseOut: function() {
                            self.$rootScope.$broadcast('highchart.mouseout');
                        },
                        hide: function() {
                            self.resetYAxisRange(this.chart);
                            self.setYAxisRange(this.chart);
                        },
                        show: function() {
                            self.resetYAxisRange(this.chart);
                            self.setYAxisRange(this.chart);
                        },
                    }
                }
            },
            drilldown: {
                series: []
            }
        };
        
        this.setType();
        this.setTrendLine();

        // console.log(this.options);
        return this.generate();
    }
    
    resetYAxisRange(chart) {
        if(this.card.chartSettings.getJson().spider.enabled) return;
    
        if(this.HighchartCardType.hasYAxis()) {
            chart.yAxis.forEach(axis => {
                axis.update({
                    startOnTick: false,
                    endOnTick: false,
                    min: null,
                    max: null,
                });
            });
        }
    }
    
    setYAxisRange(chart) {
        if(this.card.chartSettings.getJson().spider.enabled) return;
        
        if(this.HighchartCardType.hasYAxis()) {
            chart.yAxis.forEach((axis, index) => {
                let minValue = axis.getExtremes().dataMin;
                let maxValue = axis.getExtremes().dataMax;
    
                let {minValueRange, maxValueRange} = this.getValueRange(minValue, maxValue);
                
                let axisSettings = {};
                
                if(index === 0) {
                    axisSettings = this.card.chartSettings.getJson().leftYAxis;
                } else {
                    axisSettings = this.card.chartSettings.getJson().rightYAxis;
                }
                
                if(axisSettings.autoScale && ['scatter', 'bubble'].includes(this.HighchartCardType.get())) {
                    minValueRange = minValueRange === 0 ? undefined : minValueRange;
                    maxValueRange = maxValueRange === 0 ? undefined : maxValueRange;
                }
    
                if(axisSettings.autoScale && ['bullet'].includes(this.HighchartCardType.get())) {
                    let bulletSettings = this.card.chartSettings.getJson().bullet;
                    
                    if(bulletSettings.valueRanges.length) {
                        let minRangeValue = _.minBy(bulletSettings.valueRanges, range => _.toNumber(range.from)).from;
                        let maxRangeValue = _.maxBy(bulletSettings.valueRanges, range => _.toNumber(range.to)).to;
    
                        let minChartValue = Math.min(minValue, _.toNumber(minRangeValue));
                        let maxChartValue = Math.max(maxValue, _.toNumber(maxRangeValue));
    
                        ({minValueRange, maxValueRange} = this.getValueRange(minChartValue, maxChartValue));
                    }
                }
    
                axis.update({
                    startOnTick: false,
                    endOnTick: false,
                    min: axisSettings.autoScale ? minValueRange : axisSettings.rangeFrom,
                    max: axisSettings.autoScale ? maxValueRange : axisSettings.rangeTo,
                });
            });
        }
    }
    
    getValueRange(minChartValue, maxChartValue) {
        let minValueRange = minChartValue - Math.abs(maxChartValue - minChartValue) * 0.15;
        let maxValueRange = maxChartValue + Math.abs(maxChartValue - minChartValue) * 0.15;
        
        // If both values are positive
        if(minChartValue >= 0 && maxChartValue >= 0) {
            minValueRange = minValueRange < 0 ? 0 : minValueRange;
        }
        
        // If both values are negative
        if(minChartValue <= 0 && maxChartValue <= 0) {
            maxValueRange = maxValueRange > 0 ? 0 : maxValueRange;
        }
        
        return {minValueRange, maxValueRange};
    }
    
    setType() {
        this.HighchartCardType = new HighchartCardType(this.card);
        this.options.chart.type = this.HighchartCardType.get();

        // generate chart data because it is type related
        this[`generate${this.card.types.subType.capitalizeFirstLetter()}Data`]();
    }

    generateScatterData() {
        
        Highcharts.seriesTypes[this.options.chart.type].prototype.drawLegendSymbol = Highcharts.seriesTypes.line.prototype.drawLegendSymbol;
    
        Highcharts.wrap(Highcharts.seriesTypes[this.options.chart.type].prototype, 'drawLegendSymbol', function(proceed) {
            var originalRadius = this.options.marker.radius;
        
            this.options.marker.radius = HighchartConfig.marker.radius;
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
            this.options.marker.radius = originalRadius;
        
        });
        
        this.HighchartScatterData = new HighchartScatterData(this.card, this.options);
        this.HighchartScatterData.generate();
    }

    generateBubbleData() {
        this.HighchartBubbleData = new HighchartBubbleData(this.card, this.options);
        this.HighchartBubbleData.generate();
    }

    generateSankeyData() {
        this.HighchartSankeyData = new HighchartSankeyData(this.card, this.options);
        this.HighchartSankeyData.generate();
    }
    
    generateLineData() {
        
        Highcharts.seriesTypes[this.options.chart.type].prototype.drawLegendSymbol = Highcharts.seriesTypes.line.prototype.drawLegendSymbol;
    
        Highcharts.wrap(Highcharts.seriesTypes[this.options.chart.type].prototype, 'drawLegendSymbol', function(proceed) {
            var originalRadius = this.options.marker.radius;
        
            this.options.marker.radius = HighchartConfig.marker.radius;
            proceed.apply(this, Array.prototype.slice.call(arguments, 1));
            this.options.marker.radius = originalRadius;
        
        });
        
        this.HighchartLineData = new HighchartLineData(this.card, this.options);
        this.HighchartLineData.generate();
    }

    generateSplineData() {
        this.generateLineData();
    }
    
    generateGaugeData() {
        this.HighchartGaugeData = new HighchartGaugeData(this.card, this.options);
        this.HighchartGaugeData.generate();
    }

    generateArearangeData() {
        this.HighchartArearangeData = new HighchartArearangeData(this.card, this.options);
        this.HighchartArearangeData.generate();
    }

    generateBarData() {
        this.HighchartBarData = new HighchartBarData(this.card, this.options);
        this.HighchartBarData.generate();
    }

    generateSunburstData() {
        this.HighchartSunburstData = new HighchartSunburstData(this.card, this.options);
        this.HighchartSunburstData.generate();
    }

    generateTreemapData() {
        this.HighchartTreemapData = new HighchartTreemapData(this.card, this.options);
        this.HighchartTreemapData.generate();
    }

    generateBulletData() {
        this.HighchartBulletData = new HighchartBulletData(this.card, this.options);
        this.HighchartBulletData.generate();
    }

    generateHorizontalData() {
        this.generateBarData();
    }

    generateSymbolData() {
        this.HighchartSymbolData = new HighchartSymbolData(this.card, this.options);
        this.HighchartSymbolData.generate();
    }

    generatePieData() {
        this.HighchartPieData = new HighchartPieData(this.card, this.options);
        this.HighchartPieData.generate();
    }

    generateDonutData() {
        this.HighchartDonutData = new HighchartDonutData(this.card, this.options);
        this.HighchartDonutData.generate();
    }

    generateMixedData() {
        this.HighchartMixedData = new HighchartMixedData(this.card, this.options);
        this.HighchartMixedData.generate();
    }

    generateFunnelData() {
        this.HighchartFunnelData = new HighchartFunnelData(this.card, this.options);
        this.HighchartFunnelData.generate();
    }

    setResponsiveConfig() {
        this.options.responsive = {
            rules: [
                {
                    // try making legend names more responsive
                    condition: {
                        callback: function() {
                            if(this.legend.options.layout == 'vertical') {
                                if(this.chartWidth <= 500) {
                                    window.maxLegendLength = 30;
                                } else if(this.chartWidth <= 700) {
                                    window.maxLegendLength = 40;
                                } else if(this.chartWidth <= 1000) {
                                    window.maxLegendLength = 50;
                                } else {
                                    window.maxLegendLength = null;
                                }
                            } else {
                                if(this.chartWidth <= 500) {
                                    window.maxLegendLength = 50;
                                } else if(this.chartWidth <= 700) {
                                    window.maxLegendLength = 70;
                                } else if(this.chartWidth <= 1000) {
                                    window.maxLegendLength = 90;
                                } else {
                                    window.maxLegendLength = null;
                                }
                            }

                            return true;
                        }
                    },
                    chartOptions: {
                        legend: {
                            labelFormatter: function () {
                                if(!window.maxLegendLength) return this.name;

                                return this.name.length > window.maxLegendLength ? this.name.substring(0, window.maxLegendLength) + '...' : this.name;
                            }
                        }
                    }
                }, {
                    condition: {
                        maxWidth: 500
                    },
                    chartOptions: {
                        yAxis: [{
                            title: false
                        }, {
                            title: false
                        }],
                        legend: {
                            enabled: false
                        },
                        chart: {
                            spacingBottom: 15
                        }
                    }
                }, {
                    condition: {
                        maxWidth: 400
                    },
                    chartOptions: {
                        legend: {
                            enabled: false
                        },
                        chart: {
                            spacingBottom: 15
                        }
                    }
                }, {
                    condition: {
                        maxWidth: 200
                    },
                    chartOptions: {
                        yAxis: [{
                            labels: {
                                enabled: false
                            }
                        }, {
                            visible: false
                        }]
                    }
                }, {
                    condition: {
                        maxHeight: 150
                    },
                    chartOptions: {
                        xAxis: [{
                            visible: false
                        }, {
                            visible: false
                        }],
                        legend: {
                            enabled: false
                        },
                        chart: {
                            spacingBottom: 15
                        }
                    }
                }

            ]
        };
    
        if(this.HighchartCardType.hasYAxis()) {
            this.options.responsive.rules.push({
                condition: {
                    maxWidth: 400
                },
                chartOptions: {
                    yAxis: [{
                        visible: false
                    }, {
                        visible: false
                    }]
                }
            });
        }
    }

    generate() {
        this.setResponsiveConfig();
        this.chart = Highcharts.chart(this.options);

        return this.chart;
    }

    setTrendLine() {
        if(this.HighchartCardType.hasYAxis()) {
            this.options.series.forEach(serie => {
                serie.regression = this.card.showTrendLine;
                serie.regressionSettings = {
                    type: 'linear',
                    name: HighchartConfig.trendLine.legendPrefix + serie.name,
                    showInLegend: HighchartConfig.trendLine.showLegends,
                    color: HighchartConfig.trendLine.useSameColors ? serie.color : null,
                    dashStyle: 'dash',
                    lineWidth: HighchartConfig.trendLine.lineWidth,
                    tooltip: HighchartConfig.trendLine.showTooltips ? true : {pointFormat: ''},
                    extrapolate: isNull(this.card.extendTrendLine) ? '20%' : this.card.extendTrendLine,
                    dataLabels: {
                        enabled: false,
                    }
                };
            });
        }
    }
}

truedashApp.service('HighchartWrapperService', HighchartWrapperService);
