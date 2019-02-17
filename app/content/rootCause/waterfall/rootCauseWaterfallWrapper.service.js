'use strict';

var Highcharts = require('highcharts');
require('highcharts/modules/broken-axis')(Highcharts);

import RootCauseWaterfallConfig from './rootCauseWaterfall.config';
import {EventEmitter} from '../../system/events.js';

class RootCauseWaterfallWrapperService extends EventEmitter {
    constructor($rootScope, $filter) {
        super();

        this.$rootScope = $rootScope;
        this.$filter = $filter;

        // Set default highcharts options
        let userTimezoneOffset = moment().utcOffset();
        
        Highcharts.setOptions({
            credits: { enabled: false },
            lang: { thousandsSep: ',' },
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

        /**
         * Extend the Axis.getLinePath method in order to visualize breaks with two parallel
         * slanted lines. For each break, the slanted lines are inserted into the line path.
         */
        Highcharts.wrap(Highcharts.Axis.prototype, 'getLinePath', function(proceed, lineWidth) {
            let axis = this,
                path = proceed.call(this, lineWidth),
                x = path[1],
                y = path[2];

            Highcharts.each(this.breakArray || [], function(brk) {
                if (axis.horiz) {
                    x = axis.toPixels(brk.from);
                    path.splice(3, 0,
                        'L', x - 4, y, // stop
                        'M', x - 9, y + 5, 'L', x + 1, y - 5, // left slanted line
                        'M', x - 1, y + 5, 'L', x + 9, y - 5, // higher slanted line
                        'M', x + 4, y
                    );
                } else {
                    y = axis.toPixels(brk.from);
                    path.splice(3, 0,
                        'L', x, y - 4, // stop
                        'M', x + 5, y - 9, 'L', x - 5, y + 1, // lower slanted line
                        'M', x + 5, y - 1, 'L', x - 5, y + 9, // higher slanted line
                        'M', x, y + 4
                    );
                }
            });
            return path;
        });

    }
    
    maxPositiveValue(zeroLimit = true) {
        let value = this.impacts.items.reduce((value, item) => {
        
            if(item.goal) {
                return {max: item.value.previous, total: item.value.previous};
            }
        
            value.total += item.value.impact;
        
            if(value.total > value.max) value.max = value.total;
        
            return value;
        }, {max: 0, total: 0}).max;
        
        return zeroLimit ? Math.max(value, 0) : value;
    }
    
    maxNegativeValue(zeroLimit = true) {
        let value = this.impacts.items.reduce((value, item) => {
        
            if(item.goal) {
                return {min: item.value.previous, total: item.value.previous};
            }
        
            value.total += item.value.impact;
        
            if(value.total < value.min) value.min = value.total;
        
            return value;
        }, {min: 0, total: 0}).min;
        
        return zeroLimit ? Math.min(value, 0) : value;
    }
    
    get valueRange() {
        return Math.abs(this.maxPositiveValue() - this.maxNegativeValue());
    }

    get breakValues() {
        let breakPoint = this.valueRange * 0.01;
        let sameSign = (this.impacts.goal.value.previous * this.impacts.goal.value.current) > 0;
        let positive = this.impacts.goal.value.previous > 0;
        let previous = Math.abs(this.impacts.goal.value.previous);
        let current = Math.abs(this.impacts.goal.value.current);
        
        // Both values must be positive and larger then breakpoint or we don't break
        if(!(sameSign && positive) || Math.min(previous, current) < breakPoint) return [];

        // let minValue = Math.min(this.impacts.goal.value.previous, this.impacts.goal.value.current);
        let minValue = this.maxNegativeValue(false);
        let maxValue = this.maxPositiveValue(false);
        let impactRange = Math.abs(maxValue - minValue);
    
        let breaks = {
            from: Math.min(impactRange * 0.1, breakPoint),
            to: minValue - Math.min(impactRange * 0.1, breakPoint)
        };
        
        breaks.from = breaks.from + ((this.valueRange - (breaks.to - breaks.from)) * 0.1);
        
        return [breaks];
    }

    create(options) {
        let self = this;

        this.impacts = options.impacts;
        this.breakColumns = options.breakColumns;
        this.element = options.element;

        this.options = {
            chart: {
                renderTo: this.element,
                type: 'waterfall'
            },
            exporting: {
                enabled: false,
                formAttributes: {
                    target: '_blank'
                }
            },
            legend: {
                enabled: false
            },
            title: { text: '' },
            subtitle: { text: '' },
            xAxis: {
                lineWidth: 1,
                gridLineWidth: 0,
                title: false,
                type: 'category',
                labels: {
                    formatter: function () {
                        if (!this.isFirst && !this.isLast) {
                            let driver = self.impacts.items.find(driver => driver.metric.name === this.value);
                            let color = RootCauseWaterfallConfig.colors[0];
                            if(driver) color = driver.impactIsGood ? RootCauseWaterfallConfig.colors[2] : RootCauseWaterfallConfig.colors[1];
                            return `<span style="fill: ${color}; font-weight:bold">${this.value}</span>`;
                        }

                        return this.value;
                    }
                }
            },
            yAxis: {
                max: this.maxPositiveValue() + this.valueRange * (this.maxPositiveValue() > 0 ? 0.1 : 0),
                min: this.maxNegativeValue() - this.valueRange * (this.maxNegativeValue() < 0 ? 0.1 : 0),
                endOnTick: false,
                lineWidth: 1,
                gridLineWidth: 0,
                title: false,
                visible: true,
                plotLines: [{
                    color: '#C0C0C0',
                    width: 1,
                    value: 0,
                    dashStyle: 'longdash',
                }],
                events: {
                    /**
                     * On top of each column, draw a zigzag line where the axis break is.
                     */
                    pointBreak: function(e) {
                        let point = e.point,
                            brk = e.brk,
                            shapeArgs = point.shapeArgs,
                            x = shapeArgs.x,
                            y = this.translate(brk.from, 0, 1, 0, 1),
                            w = shapeArgs.width,
                            key = ['brk', brk.from, brk.to],
                            path = ['M', x, y, 'L', x + w * 0.25, y + 4, 'L', x + w * 0.75, y - 4, 'L', x + w, y];

                        if (!point[key]) {
                            point[key] = this.chart.renderer.path(path)
                                .attr({
                                    'stroke-width': 2,
                                    stroke: point.series.options.borderColor
                                })
                                .add(point.graphic.parentGroup);
                        } else {
                            point[key].attr({
                                d: path
                            });
                        }
                    }
                }
            },
            tooltip: {
                useHTML: true,
                formatter: function () {
                    return '<strong>Drill into </strong><br>' + this.point.impact.metric.name;
                }
            },
            plotOptions: {
                series: {
                    fillOpacity: 0.25,
                    marker: {
                        enabled: false
                    },
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function() {
                                self.$rootScope.$broadcast('rootCauseWaterfall.point.click', this.impact);
                            }
                        }
                    }
                }
            }
        };
        
        if(this.breakColumns) {
            this.options.yAxis.breaks = this.breakValues;
            
            // We need to remove collapsed data range from total calculation because for large values it can make charts look bad
            let collapsedValueRange = Math.abs(this.valueRange - Math.abs(this.options.yAxis.breaks[0].to - this.options.yAxis.breaks[0].from));
            
            this.options.yAxis.max = this.maxPositiveValue() + collapsedValueRange * (this.maxPositiveValue() > 0 ? 0.1 : 0);
            this.options.yAxis.min = this.maxNegativeValue() - collapsedValueRange * (this.maxNegativeValue() < 0 ? 0.1 : 0);
        }

        this.setData();

        return this.generate();
    }

    setData() {
        let self = this;

        let waterfall = {
            upColor: RootCauseWaterfallConfig.colors[2],
            color: RootCauseWaterfallConfig.colors[1],
            data: [],
            dataLabels: {
                enabled: true,
                style: {
                    fontSize: '13px',
                    textOutline: 'none'
                },
                formatter: function() {
                    // If point is driver metric we will prefix positives with +
                    return self.$filter('value')(this.y, {symbol: self.impacts.goal.symbol}, true, !this.point.impact.goal);
                }
            },
            pointPadding: 0
        };

        this.impacts.items.forEach(item => {
            if(item.goal) {
                waterfall.data.push({
                    name: 'Goal Metric - Before',
                    color: RootCauseWaterfallConfig.colors[0],
                    y: item.value.previous,
                    impact: item
                });
            } else {
                waterfall.data.push({
                    name: item.metric.name,
                    y: item.value.impact,
                    color: item.impactIsGood ? RootCauseWaterfallConfig.colors[2] : RootCauseWaterfallConfig.colors[1],
                    dataLabels: {
                        verticalAlign: item.impactIsGood ? 'top' : 'bottom',
                        y: item.impactIsGood ? -25 : 25,
                        color: item.impactIsGood ? RootCauseWaterfallConfig.colors[2] : RootCauseWaterfallConfig.colors[1]
                    },
                    impact: item
                });
            }
        });

        waterfall.data.push({
            name: 'Goal Metric - After',
            isSum: true,
            color: RootCauseWaterfallConfig.colors[0],
            impact: this.impacts.goal
        });

        this.options.series = [waterfall];
    }

    generate() {
        this.chart = Highcharts.chart(this.options);

        return this.chart;
    }
}

truedashApp.service('RootCauseWaterfallWrapperService', RootCauseWaterfallWrapperService);
