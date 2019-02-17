'use strict';

let Highcharts = require('highcharts');
require('highcharts/highcharts-more')(Highcharts);
require('highcharts/modules/solid-gauge')(Highcharts);

import HighchartData from './highchartData';
import {Helpers} from '../../common/helpers';
import {Config} from '../../config';

export default class HighchartGaugeData extends HighchartData {
    constructor(card, chartOptions) {
        super(card);
        
        this.card = card;
        this.chartOptions = chartOptions;
        this.chartOptions.tooltip.enabled = false;
        this.chartOptions.tooltip.crosshairs = false;
        
        this.Auth = window.$injector.get('Auth');
        
        this.chartOptions.pane = {
            center: ['50%', '85%'],
            size: '100%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: (Highcharts.theme && Highcharts.theme.plotBackgroundColor) || '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        };
        
        this.chartOptions.yAxis.forEach(yAxis => delete yAxis.gridLineInterpolation);
    }
    
    generate() {
        this.setData();
        this.setYAxis();
    }
    
    get min() {
        let min = 0;
        
        let value = this.getValue();
        let goal = this.card.goal;
        let smallerValue = Math.min(value, goal);
        
        if(smallerValue < 0) min = smallerValue * 1.2;
        
        if(smallerValue === 0) {
            if(smallerValue === goal) min = -(value * 0.2);
        }
        
        return this.roundNumber(min);
    }
    
    get max() {
        let max = 0;
        
        let value = this.getValue();
        let goal = this.card.goal;
        let greaterValue = Math.max(value, goal);
        
        if(greaterValue > 0) {
            max = greaterValue * 1.2;
        }
        
        if(greaterValue === 0) {
            if(greaterValue === value) max = value * 0.2;
        }
        
        return this.roundNumber(max);
    }
    
    /**
     * Round number to nearest 10, 100, 1000, etc. unit
     * For example 55 will become 60 and 563.550 will become 600k
     */
    roundNumber(number) {
        let isNegative = number < 0;
        
        number = Math.abs(number);
        
        let rounding = parseInt(1 + '0'.repeat(parseInt(number).toString().length - 1));
        
        number = number ? Math.ceil(number / rounding) * rounding : number;
        
        return isNegative ? -number : number;
    }
    
    get goal() {
        return this.card.goal;
    }
    
    get isIncrease() {
        return this.getMetric() && this.getMetric().isIncrease;
    }
    
    get goalColor() {
        let color = this.getMetric() && this.getMetric().color;
        
        return color || '#7FC3F1';
    }
    
    get goalReached() {
        if(this.isIncrease) {
            return this.getValue() >= this.goal;
        }
        
        return this.getValue() <= this.goal;
    }
    
    setYAxis() {
        this.chartOptions.yAxis.forEach(yAxis => {
            angular.extend(yAxis, {
                lineWidth: 0,
                minorTickInterval: null,
                tickAmount: 2,
                startOnTick: true,
                tickWidth: 0,
                labels: {
                    y: 16
                },
                reversed: !this.isIncrease,
                tickPositions: [this.min, this.max],
                min: this.min,
                max: this.max
            });
            
            this.card.hasGoal() && angular.extend(yAxis, {
                plotBands: [{
                    color: this.goalColor,
                    from: this.isIncrease ? this.min : this.max,
                    to: this.goal,
                    innerRadius: '60%',
                    outerRadius: '100%'
                }, {
                    color: this.goalReached ? 'rgba(22, 160, 133, .2)' : 'rgba(192, 57, 43, .2)',
                    from: this.isIncrease ? this.min : this.max,
                    to: this.getValue(),
                    innerRadius: '60%',
                    outerRadius: '80%'
                }],
            });
        });
    }
    
    setData() {
        let self = this;
        let data = {
            data: [this.getValue()],
            dataLabels: {
                formatter: function() {
                    let value = self.$filter('value')(
                        this.y,
                        this.series.userOptions.custom.formatting.info,
                        false,
                        false,
                        this.series.userOptions.custom.metric.numberOfDecimals
                    );
                    
                    return `<div style="text-align:center"><span style="font-size:15px;color:#434343">${value}</span></div>`;
                },
                y: 40,
                borderWidth: 0,
                useHTML: true
            },
            innerRadius: '100%',
            radius: '80%',
            dial: {
                backgroundColor: '#434343',
                borderColor: '#434343',
            },
            pivot: {
                backgroundColor: '#434343',
                borderColor: '#434343',
            }
        };
        
        this.wrapWithFormattingInfo(data, this.getMetric());
        
        this.chartOptions.series = [data];
    }
    
    getMetric() {
        // Get first visible metric
        return this.card.metrics.find(metric => !metric.isHidden());
    }
    
    getValue() {
        let value = 0;
        if(this.getMetric()) {
            this.getMetric().getData().forEach(val => value += val[1]);
            value = Helpers.round(value, this.getMetric().numberOfDecimals);
        }
        
        return value;
    }
}
