'use strict';

var Highcharts = require('highcharts');
require('highcharts/modules/treemap')(Highcharts);

import HighchartData from './highchartData';
import {Helpers} from '../../common/helpers';
import HighchartConfig from './highchart.config';

export default class HighchartTreemapData extends HighchartData {
    constructor(card, chartOptions) {
        super(card);
        
        this.card = card;
        this.useTooltipSymbols = true;
        this.chartOptions = chartOptions;
        this.chartOptions.tooltip.crosshairs = false;
        this.chartOptions.tooltip.shared = false;
        this.chartOptions.plotOptions.series.marker.enabled = true;
    
        delete this.chartOptions.plotOptions.series.point.events.click;
    
        this.chartData = [];
    }
    
    generate() {
        this.chartOptions.series = this.transformData();
    
        let numberOfGroups = this.card.metrics.originalData.columns.filter(column => column.title).length;
        let numberOfMetrics = this.card.metrics.originalData.columns.length - numberOfGroups;
    
        // If we have only one metric we will sort by value in descending order
        if(numberOfMetrics === 1) {
            this.card.metrics.originalData.results.sort((a, b) => b[numberOfGroups] - a[numberOfGroups]);
        }
        
        if(!this.metrics.length) {
            this.setError('Treemap diagrams must have at least one visible metric');
        } else if(!this.card.groupings.length) {
            this.transformRegularData();
        } else {
            if(this.card.frequencies.isTotalSelected()) {
                this.convertForGroupingsWithTotalFrequency();
            } else {
                this.transformGroupingData();
            }
        }
    }
    
    transformRegularData() {
        let dateFormatter = Helpers.formatDate(this.card.frequencies.selected);
        
        this.chartOptions.series.forEach(serie => {
            let names = [serie.name];
            
            this.addChartData(0, names, undefined, serie.color, serie.custom);
            
            serie.data.forEach((result) => {
                names = [serie.name];
                
                let name = 'Total';
                if(!this.card.frequencies.isTotalSelected()) {
                    name = dateFormatter(result[0]);
                }
                
                names.push(name);
                
                this.addChartData(1, names, result[1], undefined, serie.custom);
            });
        });
        
        this.chartOptions.series[0].data = this.getChartData();
        this.chartOptions.series[0].levels = this.getChartLevels();
        
        this.chartOptions.series = [this.chartOptions.series[0]];
        
        this.setSingleMetricColors();
    }
    
    convertForGroupingsWithTotalFrequency() {
        this.chartOptions.series.forEach(serie => {
            let names = [serie.name];
            
            this.addChartData(0, names, undefined, serie.color, serie.custom);
            
            this.card.metrics.originalData.results.forEach((result, resultIndex) => {
                names = [serie.name];
                
                let groupingIndex = 0;
                
                result.some((grouping, index) => {
                    if(index >= this.card.groupings.length) return;
                    
                    let lastLevel = index + 1 === this.card.groupings.length;
                    
                    // if(grouping === 'null') {
                    //     if(lastLevel) {
                    //         this.addToParentValue(groupingIndex, names.join(', '), serie.data[resultIndex][1]);
                    //
                    //         return true;
                    //     }
                    //
                    //     return false;
                    // }
                    
                    groupingIndex++;
                    
                    names.push(grouping);
                    
                    let value = lastLevel ? serie.data[resultIndex][1] : undefined;
                    
                    this.addChartData(groupingIndex, names, value, undefined, serie.custom);
                });
            });
        });
        
        this.recalculateParentValues();
        
        this.chartOptions.series[0].data = this.getChartData();
        this.chartOptions.series[0].levels = this.getChartLevels();
        
        this.chartOptions.series = [this.chartOptions.series[0]];
        
        this.setSingleMetricColors();
    }
    
    transformGroupingData() {
        let dateFormatter = Helpers.formatDate(this.card.frequencies.selected);
        
        let metrics = new Map();
        this.card.metrics.originalData.results.forEach(columnData => {
            let groupings = columnData.slice(0, this.card.groupings.length);
            let metricsData = new Map();
            
            columnData.forEach((value, index) => {
                if(index < this.card.groupings.length) return;
                
                let metric = this.card.metrics.getByColumnDesc(this.card.metrics.originalData.columns[index]);
                if (this.card.metrics.getVisibleMetrics().includes(metric)) {
                    let data = metricsData.get(metric) || [];
                    data.push([this.card.metrics.originalData.columns[index].time, value]);
                    metricsData.set(metric, data);
                }
            });
            
            
            metricsData.forEach((data, metric) => {
                metrics.set(metric, metrics.get(metric) || {});
                
                data.forEach(item => {
                    metrics.get(metric)[item[0]] = metrics.get(metric)[item[0]] || [];
                    
                    metrics.get(metric)[item[0]].push([...groupings, item[1]]);
                });
            });
        });
        
        metrics.forEach((data, metric) => {
            let names = [metric.label];
            let info = this.wrapWithFormattingInfo({}, metric);
            
            this.addChartData(0, names, undefined, metric.color, info.custom);
            
            _.forEach(data, (result, timestamp) => {
                names = [metric.label, dateFormatter(parseInt(timestamp))];
                
                this.addChartData(1, names, undefined, undefined, info.custom);
                
                result.forEach(items => {
                    names = [metric.label, dateFormatter(parseInt(timestamp))];
                    
                    let groupingIndex = 0;
                    
                    items.forEach((grouping, index) => {
                        if(index >= this.card.groupings.length) return;
                        
                        let lastLevel = index + 1 === this.card.groupings.length;
                        
                        if(grouping === 'null') {
                            if(lastLevel) {
                                this.addToParentValue(groupingIndex + 1, names.join(', '), items[index + 1]);
                                
                                return true;
                            }
                            
                            return false;
                        }
                        
                        groupingIndex++;
                        
                        names.push(grouping);
                        
                        let value = (index + 1 === this.card.groupings.length) ? items[index + 1] : undefined;
                        
                        this.addChartData(groupingIndex + 1, names, value, undefined, info.custom);
                    });
                });
            });
        });
        
        this.recalculateParentValues();
        
        this.chartOptions.series[0].data = this.getChartData();
        this.chartOptions.series[0].levels = this.getChartLevels();
        
        this.chartOptions.series = [this.chartOptions.series[0]];
        
        this.setSingleMetricColors();
    }
    
    setSingleMetricColors() {
        this.chartOptions.series.forEach(serie => {
            // In case when there is a single metric with no custom color we want to convert treemap to
            // use different colors for second level instead of making entire chart in one same color
            if(!serie.color && this.card.metrics.getVisibleMetrics().length === 1) {
                // Splice in white for the center circle
                Highcharts.getOptions().colors.splice(0, 0, 'white');
                
                delete this.chartOptions.series[0].levels[1].colorVariation;
                this.chartOptions.series[0].levels[1].colorByPoint = true;
            }
        });
    }
    
    getChartLevels() {
        return _.reduce(this.chartData, (data, items, key) => {
            let level = {level: key + 1};
            
            if(key === 0) {
                level.colorByPoint = true;
                level.dataLabels = {
                    enabled: true,
                };
            } else {
                level.colorVariation = {
                    key: 'brightness',
                    to: -0.5,
                };
            }
            
            return [...data, level];
        }, []);
    }
    
    getChartData() {
        // We need to remove level keys from data array and make it single dimension array
        // Converting from {0: [item1], 1: [item2]} to [item1, item2]
        return _.reduce(this.chartData, (data, items) => {
            return [...data, ...items];
        }, []);
    }
    
    addChartData(level, names, value, color, custom) {
        let name = _.last(names);
        let parent = names.slice(0, names.length - 1).join(', ');
        let id = parent ? [parent, name].join(', ') : name;
        
        // If data already exists we do nothing
        if(_.get(this.chartData, level, []).find(item => item.id === id)) return;
        
        this.chartData[level] = _.get(this.chartData, level, []);
    
        this.chartData[level].push({id, name, parent, value, color, custom});
    }
    
    transformData() {
        
        let columns = [];
        
        this.metrics.forEach((metric, index) => {
    
            let data = {
                type: 'treemap',
                name: metric.label,
                data: metric.getData(),
                allowDrillToNode: true,
                animationLimit: 1000,
                layoutAlgorithm: this.card.chartSettings.getJson().treemap.layoutAlgorithm, // squarified, sliceAndDice, stripes, strip
                layoutStartingDirection: this.card.chartSettings.getJson().treemap.layoutStartingDirection, // vertical, horizontal
                levelIsConstant: false,
                cursor: 'pointer',
                color: metric.color,
                dataLabels: {
                    enabled: false,
                },
            };
            
            let self = this;
            if(this.useTooltipSymbols) {
                data.tooltip = data.tooltip || {};
                data.tooltip.pointFormatter = function() {
                    let custom = this.custom || (this.point && this.point.custom) || this.series.userOptions.custom;
    
                    let value = self.$filter('value')(
                        this.value,
                        custom.formatting.info,
                        false,
                        false,
                        custom.metric.numberOfDecimals
                    );
                    
                    let header = `<span class="highcharts-header"> ${this.parent}</span><br/>`;
                    
                    return `${header}<span style="color:${this.color}; font-size: 14px;">${HighchartConfig.symbols[0]}</span> ${this.name}: <b>${value}</b><br/>`;
                };
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
    
    recalculateParentValues() {
        this.chartData.slice().reverse().forEach((items, index) => {
            let currentLevel = this.chartData.length - 1 - index;
            
            items.forEach(item => {
                this.addToParentValue(currentLevel - 1, item.parent, item.value);
            });
        });
    }
    
    addToParentValue(level, parentId, value) {
        let parent = _.get(this.chartData, level, []).find(parent => parent.id === parentId);
        
        if(parent) {
            parent.value = (parent.value || 0) + value;
        }
    }
}
