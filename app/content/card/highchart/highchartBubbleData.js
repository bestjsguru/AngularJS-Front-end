'use strict';

var Highcharts = require('highcharts');

import HighchartData from './highchartData';
import GroupingTransformer from './groupingTransformer';
import {Config} from '../../config';
import HighchartConfig from './highchart.config';
import {Helpers} from '../../common/helpers';

export default class HighchartBubbleData extends HighchartData {
    constructor(card, chartOptions) {
        super(card);
        
        this.card = card;
        this.chartOptions = chartOptions;
    
        let self = this;
    
        if(card.chartSettings.getJson().valueLabels.show) {
            angular.extend(this.chartOptions.plotOptions.series, {
                dataLabels: {
                    enabled: true,
                    color: Highcharts.theme && Highcharts.theme.dataLabelsColor || '#6F6F6F',
                    formatter: function() {
                        let custom = (this.point && this.point.custom) || this.series.userOptions.custom;
    
                        return self.$filter('value')(
                            this.point.z,
                            custom.z.formatting.info,
                            false,
                            false,
                            custom.z.metric.numberOfDecimals,
                        );
                    }
                }
            });
        }
        
        if(!card.chartSettings.getJson().fillChart) {
            angular.extend(this.chartOptions.plotOptions.series, {
                marker: {
                    fillColor: 'transparent',
                    lineWidth: 2,
                }
            });
        }
    }
    
    get metrics() {
        return this.card.metrics.getVisibleMetrics();
    }
    
    generate() {
        this.chartOptions.series = [];
        
        this.formatAxis();
        
        if(!this.card.groupings.length) {
            this.transformRegularData();
    
            if(this.hasOnlySingleValueMetrics()) {
                this.convertForSingleValueOrTotalFrequency();
            }
        } else {
            if(this.card.frequencies.isTotalSelected()) {
                this.convertForGroupingsWithTotalFrequency();
            } else {
                this.transformGroupingData();
            }
        }
    
        this.setAxisFormatting(this.chartOptions.xAxis, this.chartOptions.series[0].custom.x.formatting);
        this.setAxisFormatting(this.chartOptions.yAxis[0], this.chartOptions.series[0].custom.y.formatting);
    
        this.chartOptions.plotOptions.series.marker.enabled = true;
    }
    
    formatAxis() {
        delete this.chartOptions.xAxis.type;
        
        this.chartOptions.xAxis.title = this.card.chartSettings.getJson().xAxis.show ? {
            text: this.getFirstMetric().label,
        } : false;
        this.chartOptions.yAxis[0].title = this.card.chartSettings.isLeftYAxisVisible() ? {
            text: this.getSecondMetric().label,
        } : false;
    }
    
    setAxisFormatting(axis, formatting) {
        axis.labels = {enabled: _.get(axis.labels, 'enabled', true)};
        
        if(formatting.info) {
            axis.labels.formatter = function () {
                if(formatting.info.type === 'time') {
                    return Helpers.toHHMMSS(this.value);
                }
    
                let label = this.axis.defaultLabelFormatter.call(this);
                
                if(formatting.info.symbol === '123') formatting.info.symbol = '';
                
                return formatting.prefix ? formatting.info.symbol + label : label + formatting.info.symbol;
            };
        }
    }
    
    getFirstMetric() {
        return this.metrics.find(metric => this.card.metrics.getMetricId(metric) === this.card.chartSettings.getJson().bubble.xAxisMetric.id);
    }
    
    getSecondMetric() {
        return this.metrics.find(metric => this.card.metrics.getMetricId(metric) === this.card.chartSettings.getJson().bubble.yAxisMetric.id);
    }
    
    getThirdMetric() {
        return this.metrics.find(metric => this.card.metrics.getMetricId(metric) === this.card.chartSettings.getJson().bubble.zAxisMetric.id)
    }
    
    transformRegularData() {
        
        let metrics = [this.getFirstMetric(), this.getSecondMetric(), this.getThirdMetric()];
        
        let columns = _.map(_.groupBy(_.flatten(metrics.map(metric => metric.getData())), '[0]'), (data, date) => {
            return _.flatten([...data.map(value => {
                return value[1];
            }), +date]);
        });
        
        let self = this;
    
        let data = {
            name: 'Date',
            data: columns.map(item => {
                return {
                    name: item[3],
                    x: item[0],
                    y: item[1],
                    z: item[2],
                };
            }),
            color: Helpers.hexToRgba(Highcharts.getOptions().colors[0], 50),
            tooltip: {
                headerFormat: '',
                pointFormatter: function() {
                    let custom = this.series.userOptions.custom;
                    let valueX = self.$filter('value')(
                        this.x,
                        custom.x.formatting.info,
                        false,
                        false
                    );
                    let valueY = self.$filter('value')(
                        this.y,
                        custom.y.formatting.info,
                        false,
                        false
                    );
                    let valueZ = self.$filter('value')(
                        this.z,
                        custom.z.formatting.info,
                        false,
                        false
                    );
    
                    let name = this.name;
                    
                    if(!self.card.frequencies.isTotalSelected()) {
                        name = Helpers.formatDate(self.card.frequencies.selected)(name);
                    }
                    
                    let header = `<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> <span class="highcharts-header"> ${name}</span><br/>`;
            
                    return `${header}${custom.x.metric.name}: <b>${valueX}</b><br/>${custom.y.metric.name}: <b>${valueY}</b><br/>${custom.z.metric.name}: <b>${valueZ}</b><br/>`;
                }
            },
        };
    
        this.chartOptions.series = [this.wrapWithFormattingInfo(data)];
    }
    
    transformGroupingData() {
        
        let positions = [
            {key: 0, value: this.card.columnPosition.findMetricIndex(this.getFirstMetric())},
            {key: 1, value: this.card.columnPosition.findMetricIndex(this.getSecondMetric())},
            {key: 2, value: this.card.columnPosition.findMetricIndex(this.getThirdMetric())},
        ];
        
        let metrics = (new GroupingTransformer(this.card)).getDimensionsGroupedByMetrics([this.getFirstMetric(), this.getSecondMetric(), this.getThirdMetric()]);
    
        let columns = metrics.map(metric => _.map(_.groupBy(metric.getData(), '[0]'), (data, date) => {
            if(data.length === 1) {
                data = [data[0], data[0], data[0]];
            } else if(data.length === 2) {
                if(this.getFirstMetric().id === this.getSecondMetric().id) {
                    data = positions[1].value > positions[2].value ? [data[1], data[1], data[0]] : [data[0], data[0], data[1]];
                }
    
                if(this.getFirstMetric().id === this.getThirdMetric().id) {
                    data = positions[0].value > positions[1].value ? [data[1], data[0], data[1]] : [data[0], data[1], data[0]];
                }
                
                if(this.getSecondMetric().id === this.getThirdMetric().id) {
                    data = positions[0].value > positions[1].value ? [data[1], data[0], data[0]] : [data[0], data[1], data[1]];
                }
            } else {
                positions.sort((a, b) => a.value - b.value);
                
                data = [data[positions[0].key], data[positions[1].key], data[positions[2].key]];
            }
            
            let dataValues = data.map(value => value[1]);
            
            return _.flatten([...dataValues, +date]);
        }));
    
        let self = this;
    
        this.chartOptions.series = columns.map((column, index) => {
            return this.wrapWithFormattingInfo({
                name: metrics[index].label,
                data: column.map(item => {
                    return {
                        name: item[3],
                        x: item[0],
                        y: item[1],
                        z: item[2],
                    };
                }),
                color: Helpers.hexToRgba(Highcharts.getOptions().colors[index], 50),
                tooltip: {
                    headerFormat: '',
                    pointFormatter: function() {
                        let custom = this.series.userOptions.custom;
                        let valueX = self.$filter('value')(
                            this.x,
                            custom.x.formatting.info,
                            false,
                            false
                        );
                        let valueY = self.$filter('value')(
                            this.y,
                            custom.y.formatting.info,
                            false,
                            false
                        );
                        let valueZ = self.$filter('value')(
                            this.z,
                            custom.z.formatting.info,
                            false,
                            false
                        );
                
                        let name = this.name;
                
                        if(!self.card.frequencies.isTotalSelected()) {
                            name = Helpers.formatDate(self.card.frequencies.selected)(name);
                        }
                
                        let header = `<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> <span class="highcharts-header"> ${this.series.name} (<strong>${name}</strong>)</span><br/>`;
                
                        return `${header}${custom.x.metric.name}: <b>${valueX}</b><br/>${custom.y.metric.name}: <b>${valueY}</b><br/>${custom.z.metric.name}: <b>${valueZ}</b><br/>`;
                    }
                },
            });
        });
    }
    
    wrapWithFormattingInfo(data) {
        data.tooltip = data.tooltip || {};
        data.custom = {
            x: {
                formatting: data.formatting || {},
                metric: {
                    id: this.card.metrics.getMetricId(this.getFirstMetric()),
                    name: this.getFirstMetric().label,
                    type: this.card.metrics.getMetricType(this.getFirstMetric()),
                    numberOfDecimals: this.getFirstMetric().numberOfDecimals,
                },
            },
            y: {
                formatting: data.formatting || {},
                metric: {
                    id: this.card.metrics.getMetricId(this.getSecondMetric()),
                    name: this.getSecondMetric().label,
                    type: this.card.metrics.getMetricType(this.getSecondMetric()),
                    numberOfDecimals: this.getSecondMetric().numberOfDecimals,
                },
            },
            z: {
                formatting: data.formatting || {},
                metric: {
                    id: this.card.metrics.getMetricId(this.getThirdMetric()),
                    name: this.getThirdMetric().label,
                    type: this.card.metrics.getMetricType(this.getThirdMetric()),
                    numberOfDecimals: this.getThirdMetric().numberOfDecimals,
                },
            },
        };
        
        // Formatting for first metric
        let infoX = this.getFirstMetric().getFormattingInfo();
    
        if(infoX.symbol) {
            data.custom.x.formatting.info = {
                type: infoX.type,
                symbol: infoX.symbol,
            };
        
            if(!['123', 'time'].includes(infoX.symbol || info.type)) {
                if(Config.chartOptions.symbols.suffixed.includes(infoX.symbol)) {
                    data.custom.x.formatting.prefix = false;
                    data.tooltip.valueSuffix = infoX.symbol;
                } else {
                    data.custom.x.formatting.prefix = true;
                    data.tooltip.valuePrefix = infoX.symbol;
                }
            }
        }
        
        // Formatting for second metric
        let infoY = this.getSecondMetric().getFormattingInfo();
    
        if(infoY.symbol) {
            data.custom.y.formatting.info = {
                type: infoY.type,
                symbol: infoY.symbol,
            };
        
            if(!['123', 'time'].includes(infoY.symbol || info.type)) {
                if(Config.chartOptions.symbols.suffixed.includes(infoY.symbol)) {
                    data.custom.y.formatting.prefix = false;
                    data.tooltip.valueSuffix = infoY.symbol;
                } else {
                    data.custom.y.formatting.prefix = true;
                    data.tooltip.valuePrefix = infoY.symbol;
                }
            }
        }
        
        // Formatting for third metric
        let infoZ = this.getThirdMetric().getFormattingInfo();
    
        if(infoZ.symbol) {
            data.custom.z.formatting.info = {
                type: infoZ.type,
                symbol: infoZ.symbol,
            };
        
            if(!['123', 'time'].includes(infoZ.symbol || info.type)) {
                if(Config.chartOptions.symbols.suffixed.includes(infoZ.symbol)) {
                    data.custom.z.formatting.prefix = false;
                    data.tooltip.valueSuffix = infoZ.symbol;
                } else {
                    data.custom.z.formatting.prefix = true;
                    data.tooltip.valuePrefix = infoZ.symbol;
                }
            }
        }
        
        return data;
    }
    
    convertForSingleValueOrTotalFrequency() {
        
        let name = 'Total';
        if(!this.card.frequencies.isTotalSelected()) {
            let dateFormatter = Helpers.formatDate(this.card.frequencies.selected);
            let date = this.chartOptions.series.reduce((date, serie) => serie.data[0].name, null);
            
            name = dateFormatter(date);
        }
        
        // In case of Total frequency or single value chart like "yearly - this year" we don't want to
        // display datetime on xAxis. Instead, we will just display plain text
        this.chartOptions.legend.enabled = false;
        
        let data = this.chartOptions.series.reduce((data, serie, index) => {
            data.push({
                name: serie.name,
                x: serie.data[0].x,
                y: serie.data[0].y,
                z: serie.data[0].z,
                color: Highcharts.getOptions().colors[this.groupingSets.reduce((index, set, setIndex) => {
                    return serie.name.includes(set) ? setIndex : index;
                }, index)]
            });
            
            return data;
        }, []);
        
        let self = this;
        this.chartOptions.series = [this.wrapWithFormattingInfo({
            name: name,
            data: data,
            tooltip: {
                pointFormatter: function() {
                    let custom = this.series.userOptions.custom;
                    let valueX = self.$filter('value')(
                        this.x,
                        custom.x.formatting.info,
                        false,
                        false
                    );
                    let valueY = self.$filter('value')(
                        this.y,
                        custom.y.formatting.info,
                        false,
                        false
                    );
                    let valueZ = self.$filter('value')(
                        this.z,
                        custom.z.formatting.info,
                        false,
                        false
                    );
                    
                    return `${custom.x.metric.name}: <b>${valueX}</b><br/>${custom.y.metric.name}: <b>${valueY}</b><br/>${custom.z.metric.name}: <b>${valueZ}</b><br/>`;
                }
            },
        })];
    }
    
    hasOnlySingleValueMetrics() {
        return this.chartOptions.series.reduce((maxDataLength, serie) => {
                return Math.max(maxDataLength, serie.data.length);
            }, 0) === 1;
    }
    
    convertForGroupingsWithTotalFrequency() {
        let positions = [
            {key: 0, value: this.card.columnPosition.findMetricIndex(this.getFirstMetric())},
            {key: 1, value: this.card.columnPosition.findMetricIndex(this.getSecondMetric())},
            {key: 2, value: this.card.columnPosition.findMetricIndex(this.getThirdMetric())},
        ];
    
        let dimension = this.card.metrics.originalData.columnPosition.find(dimension => dimension.id === this.card.chartSettings.getJson().bubble.dimension.id);
        
        let metrics = (new GroupingTransformer(this.card)).getSingleDimensionGroupedByMetrics(dimension.id, [this.getFirstMetric(), this.getSecondMetric(), this.getThirdMetric()]);
        
        let columns = metrics.map(metric => _.map(_.groupBy(metric.getData(), '[0]'), (data, name) => {
            if(data.length === 1) {
                data = [data[0], data[0], data[0]];
            } else if(data.length === 2) {
                if(this.getFirstMetric().id === this.getSecondMetric().id) {
                    data = positions[1].value > positions[2].value ? [data[1], data[1], data[0]] : [data[0], data[0], data[1]];
                }
        
                if(this.getFirstMetric().id === this.getThirdMetric().id) {
                    data = positions[0].value > positions[1].value ? [data[1], data[0], data[1]] : [data[0], data[1], data[0]];
                }
        
                if(this.getSecondMetric().id === this.getThirdMetric().id) {
                    data = positions[0].value > positions[1].value ? [data[1], data[0], data[0]] : [data[0], data[1], data[1]];
                }
            } else {
                positions.sort((a, b) => a.value - b.value);
        
                data = [data[positions[0].key], data[positions[1].key], data[positions[2].key]];
            }
            
            let dataValues = data.map(value => value[1]);
            
            return _.flatten([...dataValues, name]);
        }));
    
        let self = this;
    
        this.chartOptions.series = columns.map((column, index) => {
            return this.wrapWithFormattingInfo({
                name: metrics[index].label,
                data: column.map(item => {
                    return {
                        name: item[3],
                        x: item[0],
                        y: item[1],
                        z: item[2],
                    };
                }),
                color: Helpers.hexToRgba(Highcharts.getOptions().colors[index], 50),
                tooltip: {
                    headerFormat: '',
                    pointFormatter: function() {
                        let custom = this.series.userOptions.custom;
                        let valueX = self.$filter('value')(
                            this.x,
                            custom.x.formatting.info,
                            false,
                            false
                        );
                        let valueY = self.$filter('value')(
                            this.y,
                            custom.y.formatting.info,
                            false,
                            false
                        );
                        let valueZ = self.$filter('value')(
                            this.z,
                            custom.z.formatting.info,
                            false,
                            false
                        );
                    
                        let header = `<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> <span class="highcharts-header"> ${this.series.name} (<strong>${this.name}</strong>)</span><br/>`;
                    
                        return `${header}${custom.x.metric.name}: <b>${valueX}</b><br/>${custom.y.metric.name}: <b>${valueY}</b><br/>${custom.z.metric.name}: <b>${valueZ}</b><br/>`;
                    }
                },
            });
        });
    }
}
