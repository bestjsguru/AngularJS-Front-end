'use strict';

var Highcharts = require('highcharts');
require('highcharts/modules/funnel')(Highcharts);

import HighchartConfig from './highchart.config';
import HighchartData from './highchartData';

export default class HighchartFunnelData extends HighchartData {
    constructor(card, chartOptions) {
        super(card);

        this.card = card;
        this.chartOptions = chartOptions;
        this.chartOptions.tooltip.crosshairs = false;
        this.chartOptions.tooltip.shared = false;
    
        let self = this;
        this.funnelOptions = {
            showInLegend: true,
            neckWidth: '30%',
            neckHeight: '25%',
            width: '50%',
            dataLabels: {
                enabled: false
            },
            tooltip: {
                headerFormat: '',
                pointFormatter: function() {
                    let custom = (this.options && this.options.custom) || this.series.userOptions.custom;
        
                    let value = self.$filter('value')(
                        this.y,
                        custom.formatting.info,
                        false,
                        false,
                        custom.metric.numberOfDecimals
                    );
        
                    return `<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> ${this.name}: <b>${value}</b><br/>`;
                }
            }
        };
    
        if(card.chartSettings.getJson().valueLabels.show) {
            angular.extend(this.funnelOptions, {
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
            });
        }
    }

    generate() {
        // on funnel charts we show legends on the right side
        angular.extend(this.chartOptions.legend, {
            align: 'right',
            verticalAlign: 'top',
            layout: 'vertical'
        });
        angular.extend(this.chartOptions.plotOptions, { funnel: this.funnelOptions });

        this.setData();
    }

    setData() {
        this.chartOptions.series = this.transformData();
    }

    transformData() {

        let columns = [];

        this.metrics.forEach((metric) => {
            let data = {
                name: metric.label,
                y: this.getDataValue(metric),
                color: metric.color
            };
            
            columns.push(this.wrapWithFormattingInfo(data, metric));
        });

        return [{ data: columns }];
    }

    getDataValue(metric) {

        let data = metric.getData();
        if(!Array.isArray(data) || !(Array.isArray(data[0]) && data[0].length > 1)) {
            console.warn('Cannot find funnel data for metric: ' + metric.label, data);
            return 0;
        }

        return data[0][1];
    }
}
