'use strict';

import {Helpers} from '../../common/helpers';

var Highcharts = require('highcharts');
require('highcharts/modules/bullet')(Highcharts);

import HighchartData from './highchartData';
import HighchartConfig from './highchart.config';

export default class HighchartBulletData extends HighchartData {
    constructor(card, chartOptions) {
        super(card);
        
        this.card = card;
        this.useTooltipSymbols = true;
        this.chartOptions = chartOptions;
        this.chartOptions.tooltip.crosshairs = false;
        this.chartOptions.tooltip.shared = false;
        this.chartOptions.plotOptions.series.marker.enabled = true;
        this.chartOptions.plotOptions.series.pointPadding = 0.25;
        
        this.chartOptions.chart.inverted = true;
        
        delete this.chartOptions.xAxis.type;
    }
    
    generate() {
        this.chartOptions.series = this.transformData();
    
        if(!this.metrics.length) {
            this.setError('Bullet chart must have at least one visible metric');
        }
        else if(this.card.groupings.length) {
            this.setError('Bullet chart must not have metrics grouped by dimensions');
        } else {
            if(this.card.frequencies.isTotalSelected()) {
    
                this.chartOptions.xAxis.categories = ['Total'];
                this.chartOptions.yAxis[0].plotBands = this.card.chartSettings.getJson().bullet.valueRanges.map(range => {
                    return {
                        from: range.from,
                        to: range.to,
                        color: Helpers.shadeBlendConvert(0.4, range.color),
                    }
                });
                
            } else {
                this.setError('Bullet chart must use Total time frequency');
            }
        }
    }
    
    transformData() {
        
        let columns = [];
        let customColorsCount = 0;
        
        this.metrics.forEach((metric, index) => {
            
            if(metric.color) customColorsCount++;
            
            let data = {
                name: metric.label,
                data: [{
                    y: metric.getData()[0][1],
                    target: this.card.chartSettings.metricGoal(this.card.metrics.getMetricId(metric)),
                    targetOptions: {
                        width: '150%',
                        height: 5,
                        borderWidth: 1,
                        borderColor: Helpers.shadeBlendConvert(-0.5, metric.color || Highcharts.getOptions().colors[index - customColorsCount]),
                        color: Helpers.shadeBlendConvert(-0.3, metric.color || Highcharts.getOptions().colors[index - customColorsCount]),
                    }
                }],
                color: metric.color,
            };
            
            let self = this;
            if(this.useTooltipSymbols) {
                data.tooltip = data.tooltip || {};
                data.tooltip.headerFormat = '';
                data.tooltip.pointFormatter = function() {
                    let custom = (this.point && this.point.custom) || this.series.userOptions.custom;
    
                    let value = self.$filter('value')(
                        this.y,
                        custom.formatting.info,
                        false,
                        false,
                        custom.metric.numberOfDecimals
                    );
                    
                    let target = self.$filter('value')(
                        this.target,
                        custom.formatting.info,
                        false,
                        false,
                        custom.metric.numberOfDecimals
                    );
    
                    let header = `<span class="highcharts-header"> ${this.series.name}</span><br/>`;
    
                    return `${header}<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> <b>${value}</b> (with target at <b>${target}</b>)<br/>`;
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
}
