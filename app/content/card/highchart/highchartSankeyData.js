'use strict';

var Highcharts = require('highcharts');
require('highcharts/modules/sankey')(Highcharts);

import HighchartData from './highchartData';
import {Config} from '../../config';
import HighchartConfig from './highchart.config';

export default class HighchartSankeyData extends HighchartData {
    constructor(card, chartOptions) {
        super(card);
        
        this.card = card;
        this.chartOptions = chartOptions;
    }
    
    get metrics() {
        return this.card.metrics.getVisibleMetrics();
    }
    
    generate() {
        this.chartOptions.series = [];
        this.chartOptions.tooltip.shared = false;
    
        _.unset(this.chartOptions.plotOptions.series, 'dataLabels.style.textOutline');
    
        if(!this.metrics.length) {
            this.setError('Sankey diagrams must have at least one visible metric');
        }
        else if(!this.card.groupings.length) {
            this.setError('Sankey diagrams must have at least one grouping dimension');
        } else {
            if(this.card.frequencies.isTotalSelected()) {
                this.convertForGroupingsWithTotalFrequency();
            } else {
                this.setError('Sankey diagrams must use Total time frequency');
            }
        }
        
        this.chartOptions.plotOptions.series.marker.enabled = true;
    }
    
    getMetric() {
        return this.metrics.find(metric => this.card.metrics.getMetricId(metric) === this.card.chartSettings.getJson().sankey.metric.id);
    }
    
    wrapWithFormattingInfo(data) {
        data.tooltip = data.tooltip || {};
        data.custom = {
            formatting: data.formatting || {},
            metric: {
                id: this.card.metrics.getMetricId(this.getMetric()),
                name: this.getMetric().label,
                type: this.card.metrics.getMetricType(this.getMetric()),
                numberOfDecimals: this.getMetric().numberOfDecimals,
            },
        };
        
        // Formatting for first metric
        let info = this.getMetric().getFormattingInfo();
    
        if(info.symbol) {
            data.custom.formatting.info = {
                type: info.type,
                symbol: info.symbol,
            };
        
            if(!['123', 'time'].includes(info.symbol || info.type)) {
                if(Config.chartOptions.symbols.suffixed.includes(info.symbol)) {
                    data.custom.formatting.prefix = false;
                    data.tooltip.valueSuffix = info.symbol;
                } else {
                    data.custom.formatting.prefix = true;
                    data.tooltip.valuePrefix = info.symbol;
                }
            }
        }
        
        return data;
    }
    
    convertForGroupingsWithTotalFrequency() {
        let fromDimensionIndex = this.card.columnPosition.getJson().findIndex(dimension => dimension.id === this.card.chartSettings.getJson().sankey.fromDimension.id);
        let toDimensionIndex = this.card.columnPosition.getJson().findIndex(dimension => dimension.id === this.card.chartSettings.getJson().sankey.toDimension.id);
        let metricIndex = this.card.metrics.originalData.columnPosition.findIndex(position => {
            return position.id === this.card.metrics.getMetricId(this.getMetric()) && position.type !== 'dimension';
        });
    
        let columns = this.card.metrics.originalData.results.map(columnData => {
            return [columnData[fromDimensionIndex], columnData[toDimensionIndex], columnData[metricIndex]];
        });
    
        let self = this;
    
        this.chartOptions.series = [
            this.wrapWithFormattingInfo({
                name: this.getMetric().label,
                keys: ['from', 'to', 'weight'],
                data: columns,
                tooltip: {
                    headerFormat: '',
                    pointFormatter: function() {
                        let custom = this.series.userOptions.custom;
                        let value = self.$filter('value')(
                            this.weight,
                            custom.formatting.info,
                            false,
                            false,
                            custom.metric.numberOfDecimals
                        );
                        
                        let header = `<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> <span class="highcharts-header"> ${this.series.name}</span><br/>`;
    
                        return `${header}${this.fromNode.name} → ${this.toNode.name}: <b>${value}</b><br/>`;
                    },
                    nodeFormatter: function() {
                        let custom = this.series.userOptions.custom;
                        let value = self.$filter('value')(
                            this.sum,
                            custom.formatting.info,
                            false,
                            false,
                            custom.metric.numberOfDecimals
                        );
                        
                        let header = `<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> <span class="highcharts-header"> ${this.series.name}</span><br/>`;
    
                        return `${header}${this.name}: <b>${value}</b><br/>`;
                    }
                },
            })
        ];
    }
}
