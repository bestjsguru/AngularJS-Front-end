'use strict';

var Highcharts = require('highcharts');

Highcharts.SparkLine = function (a, b, c) {
    var hasRenderToArg = typeof a === 'string' || a.nodeName,
        options = arguments[hasRenderToArg ? 1 : 0],
        defaultOptions = {
            chart: {
                renderTo: (options.chart && options.chart.renderTo) || this,
                backgroundColor: null,
                borderWidth: 0,
                type: 'spline',
                margin: [2, 0, 2, 0],
                height: 20,
                style: {
                    overflow: 'visible',
                },
                
                // small optimalization, saves 1-2 ms each sparkline
                skipClone: true
            },
            title: {
                text: ''
            },
            credits: {
                enabled: false
            },
            xAxis: {
                labels: {
                    enabled: false
                },
                title: {
                    text: null
                },
                startOnTick: false,
                endOnTick: false,
                tickPositions: [],
                visible: false,
            },
            yAxis: {
                endOnTick: false,
                startOnTick: false,
                labels: {
                    enabled: false
                },
                title: {
                    text: null
                },
                tickPositions: [0],
                visible: false,
            },
            legend: {
                enabled: false
            },
            tooltip: {
                enabled: false,
                backgroundColor: '#fff',
                borderWidth: 1,
                shadow: true,
                useHTML: true,
                hideDelay: 0,
                shared: true,
                padding: 0,
                positioner: function (w, h, point) {
                    return { x: point.plotX - w / 2, y: point.plotY - h };
                }
            },
            navigation: {
                buttonOptions: {
                    enabled: false
                }
            },
            plotOptions: {
                series: {
                    animation: false,
                    lineWidth: 1,
                    shadow: false,
                    marker: {
                        radius: 3,
                        enabled: false,
                        states: {
                            hover: {
                                enabled: false,
                            }
                        }
                    },
                    fillOpacity: 0.25
                },
            }
        };
    
    options = Highcharts.merge(defaultOptions, options);
    
    return hasRenderToArg ?
           new Highcharts.Chart(a, options, c) :
           new Highcharts.Chart(options, b);
};

class SparklineCtrl {

    constructor($element) {
        this.$element = $element;
    }

    $onInit() {
        this.initiate();
    }

    initiate() {
        this.$element.find('.sparkline').highcharts('SparkLine', {
            series: [{
                data: this.values,
                color: this.color || null,
                lineWidth: 2,
                pointStart: 1,
            }],
            chart: {
                height: 20,
                width: 80,
            }
        });
    }
}

truedashApp.component('appSparkline', {
    controller: SparklineCtrl,
    template: `<div class="sparkline"></div>`,
    bindings: {
        values: '=',
        color: '=',
    }
});
