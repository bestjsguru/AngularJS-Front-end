'use strict';

import {EventEmitter} from '../system/events.js';
import HighchartCardType from './highchart/highchartCardType';
import {Helpers} from '../common/helpers';

export default class ChartSettings extends EventEmitter {
    constructor(card) {
        super();
        
        this.card = card;
        this.settings = {};
    }
    
    init(settings) {
        this.initItems();
    
        settings = settings || {};
    
        this.settings = JSON.parse(JSON.stringify(settings));
        this.fillMissingWithDefaults();
        
        // Reorder items based on order received from BE
        let items = this.settings.metrics.reduce((items, metric, itemIndex) => {
            let index = this.items.findIndex(item => {
                return item.id === metric.id && item.type === metric.type;
            });
            
            if(index >= 0) {
                // We need to preserve info about metrics Y axis and chart type
                let foundMetric = this.items.splice(index, 1)[0];
                foundMetric.leftYAxis = !! metric.leftYAxis;
                foundMetric.goal = Helpers.toNumber(metric.goal) || 0;
                foundMetric.chartType = metric.chartType || (!itemIndex ? 'line' : 'bar');
                foundMetric.useSymbols = !! metric.useSymbols;
                
                // If element is found we remove it from this.items and push it to sorted items.
                items = [...items, foundMetric];
            }
            
            return items;
        }, []);
        
        // In the end we add all remaining items to sorted items array.
        items = [...items, ...this.items];
        
        this.settings.metrics = items;
    
        this.trigger('loaded');
    }
    
    initItems() {
        this.items = [];
        
        this.card.metrics.items.forEach(item => {
            this.items.push({
                id: this.card.metrics.getMetricId(item),
                name: item.label,
                label: item.label,
                type: this.card.metrics.getMetricType(item),
                hidden: !! item.isHidden(),
                leftYAxis: true,
                goal: 0,
                chartType: 'line',
                useSymbols: false,
                value: item,
            });
        });
    }
    
    getJson(includeHidden = true) {
        let data = {
            fillChart: !! this.settings.fillChart,
            stacked: !! this.settings.stacked,
            spider: {
                type: _.property('spider.type')(this.settings),
                enabled: !! _.property('spider.enabled')(this.settings),
            },
            legend: {
                show: !! _.property('legend.show')(this.settings),
            },
            valueLabels: {
                show: !! _.property('valueLabels.show')(this.settings),
            },
            xAxis: {
                label: _.property('xAxis.label')(this.settings),
                show: !! _.property('xAxis.show')(this.settings),
            },
            leftYAxis: {
                label: _.property('leftYAxis.label')(this.settings),
                autoLabel: !! _.property('leftYAxis.autoLabel')(this.settings),
                show: !! _.property('leftYAxis.show')(this.settings),
                autoScale: !! _.property('leftYAxis.autoScale')(this.settings),
                range: !! _.property('leftYAxis.range')(this.settings),
                rangeFrom: _.property('leftYAxis.rangeFrom')(this.settings),
                rangeTo: _.property('leftYAxis.rangeTo')(this.settings),
            },
            rightYAxis: {
                label: _.property('rightYAxis.label')(this.settings),
                autoLabel: !! _.property('rightYAxis.autoLabel')(this.settings),
                show: !! _.property('rightYAxis.show')(this.settings),
                autoScale: !! _.property('rightYAxis.autoScale')(this.settings),
                range: !! _.property('rightYAxis.range')(this.settings),
                rangeFrom: _.property('rightYAxis.rangeFrom')(this.settings),
                rangeTo: _.property('rightYAxis.rangeTo')(this.settings),
            },
            metrics: this.getMetricsJson(includeHidden),
        };
        
        if(this.card.types.subType === 'scatter') {
            data.scatter = this.getScatterJson();
        }
        
        if(this.card.types.subType === 'bubble') {
            data.bubble = this.getBubbleJson();
        }
        
        if(this.card.types.subType === 'sankey') {
            data.sankey = this.getSankeyJson();
        }
        
        if(this.card.types.subType === 'bullet') {
            data.bullet = this.getBulletJson();
        }
        
        if(this.card.types.subType === 'treemap') {
            data.treemap = this.getTreemapJson();
        }
        
        return data;
    }
    
    getScatterJson() {
        let scatter = {
            xAxisMetric: _.property('scatter.xAxisMetric')(this.settings),
            yAxisMetric: _.property('scatter.yAxisMetric')(this.settings),
            dimension: _.property('scatter.dimension')(this.settings),
        };
        
        let metrics = this.getMetricsJson(false);
        let dimensions = [];
        
        if(this.card.groupings.length && this.card.frequencies.isTotalSelected()) {
            dimensions = this.card.groupings.items.map(item => ({
                id: item.column.id,
                name: item.column.name,
                dimensionName: item.name,
                label: item.column.getLabel(),
            }))
        }
        
        // Check if metric still exists on the card and if not preselect with default
        if(!scatter.xAxisMetric || (scatter.xAxisMetric && !metrics.find(metric => metric.id === scatter.xAxisMetric.id))) {
            scatter.xAxisMetric = metrics.length ? {
                id: metrics[0].id,
                name: metrics[0].name,
                type: metrics[0].type,
            } : undefined;
        }
        
        if(scatter.xAxisMetric) scatter.xAxisMetric = {
            id: scatter.xAxisMetric.id,
            name: scatter.xAxisMetric.name,
            type: scatter.xAxisMetric.type,
        };
        
        // Check if metric still exists on the card and if not preselect with default
        if(!scatter.yAxisMetric || (scatter.yAxisMetric && !metrics.find(metric => metric.id === scatter.yAxisMetric.id))) {
            scatter.yAxisMetric = metrics.length ? {
                id: _.get(metrics, '[1]', metrics[0]).id,
                name: _.get(metrics, '[1]', metrics[0]).name,
                type: _.get(metrics, '[1]', metrics[0]).type,
            } : undefined;
        }
    
        if(scatter.yAxisMetric) scatter.yAxisMetric = {
            id: scatter.yAxisMetric.id,
            name: scatter.yAxisMetric.name,
            type: scatter.yAxisMetric.type,
        };
        
        // Check if dimension still exists on the card and if not preselect with default
        if(!scatter.dimension || (scatter.dimension && !dimensions.find(dimension => dimension.id === scatter.dimension.id))) {
            scatter.dimension = dimensions.length ? {
                id: dimensions[0].id,
                name: dimensions[0].name,
                dimensionName: dimensions[0].dimensionName,
            } : undefined;
        }
        
        return scatter;
    }
    
    getBubbleJson() {
        let bubble = {
            xAxisMetric: _.property('bubble.xAxisMetric')(this.settings),
            yAxisMetric: _.property('bubble.yAxisMetric')(this.settings),
            zAxisMetric: _.property('bubble.zAxisMetric')(this.settings),
            dimension: _.property('bubble.dimension')(this.settings),
        };
        
        let metrics = this.getMetricsJson(false);
        let dimensions = [];
        
        if(this.card.groupings.length && this.card.frequencies.isTotalSelected()) {
            dimensions = this.card.groupings.items.map(item => ({
                id: item.column.id,
                name: item.column.name,
                dimensionName: item.name,
                label: item.column.getLabel(),
            }))
        }
        
        // Check if metric still exists on the card and if not preselect with default
        if(!bubble.xAxisMetric || (bubble.xAxisMetric && !metrics.find(metric => metric.id === bubble.xAxisMetric.id))) {
            bubble.xAxisMetric = metrics.length ? {
                id: metrics[0].id,
                name: metrics[0].name,
                type: metrics[0].type,
            } : undefined;
        }
        
        if(bubble.xAxisMetric) bubble.xAxisMetric = {
            id: bubble.xAxisMetric.id,
            name: bubble.xAxisMetric.name,
            type: bubble.xAxisMetric.type,
        };
        
        // Check if metric still exists on the card and if not preselect with default
        if(!bubble.yAxisMetric || (bubble.yAxisMetric && !metrics.find(metric => metric.id === bubble.yAxisMetric.id))) {
            bubble.yAxisMetric = metrics.length ? {
                id: _.get(metrics, '[1]', metrics[0]).id,
                name: _.get(metrics, '[1]', metrics[0]).name,
                type: _.get(metrics, '[1]', metrics[0]).type,
            } : undefined;
        }
    
        if(bubble.yAxisMetric) bubble.yAxisMetric = {
            id: bubble.yAxisMetric.id,
            name: bubble.yAxisMetric.name,
            type: bubble.yAxisMetric.type,
        };
        
        // Check if metric still exists on the card and if not preselect with default
        if(!bubble.zAxisMetric || (bubble.zAxisMetric && !metrics.find(metric => metric.id === bubble.zAxisMetric.id))) {
            bubble.zAxisMetric = metrics.length ? {
                id: _.get(metrics, '[2]', _.get(metrics, '[1]', metrics[0])).id,
                name: _.get(metrics, '[2]', _.get(metrics, '[1]', metrics[0])).name,
                type: _.get(metrics, '[2]', _.get(metrics, '[1]', metrics[0])).type,
            } : undefined;
        }
    
        if(bubble.zAxisMetric) bubble.zAxisMetric = {
            id: bubble.zAxisMetric.id,
            name: bubble.zAxisMetric.name,
            type: bubble.zAxisMetric.type,
        };
        
        // Check if dimension still exists on the card and if not preselect with default
        if(!bubble.dimension || (bubble.dimension && !dimensions.find(dimension => dimension.id === bubble.dimension.id))) {
            bubble.dimension = dimensions.length ? {
                id: dimensions[0].id,
                name: dimensions[0].name,
                dimensionName: dimensions[0].dimensionName,
            } : undefined;
        }
        
        return bubble;
    }
    
    getSankeyJson() {
        let sankey = {
            metric: _.property('sankey.metric')(this.settings),
            fromDimension: _.property('sankey.fromDimension')(this.settings),
            toDimension: _.property('sankey.toDimension')(this.settings),
        };
        
        let metrics = this.getMetricsJson(false);
        let dimensions = [];
        
        if(this.card.groupings.length) {
            dimensions = this.card.groupings.items.map(item => ({
                id: item.column.id,
                name: item.column.name,
                dimensionName: item.name,
                label: item.column.getLabel(),
            }))
        }
        
        // Check if metric still exists on the card and if not preselect with default
        if(!sankey.metric || (sankey.metric && !metrics.find(metric => metric.id === sankey.metric.id))) {
            sankey.metric = metrics.length ? {
                id: metrics[0].id,
                name: metrics[0].name,
                type: metrics[0].type,
            } : undefined;
        }
        
        if(sankey.metric) sankey.metric = {
            id: sankey.metric.id,
            name: sankey.metric.name,
            type: sankey.metric.type,
        };
        
        // Check if dimension still exists on the card and if not preselect with default
        if(!sankey.fromDimension || (sankey.fromDimension && !dimensions.find(dimension => dimension.id === sankey.fromDimension.id))) {
            sankey.fromDimension = dimensions.length ? {
                id: dimensions[0].id,
                name: dimensions[0].name,
                dimensionName: dimensions[0].dimensionName,
            } : undefined;
        }
        
        // Check if dimension still exists on the card and if not preselect with default
        if(!sankey.toDimension || (sankey.toDimension && !dimensions.find(dimension => dimension.id === sankey.toDimension.id))) {
            sankey.toDimension = dimensions.length ? {
                id: _.get(dimensions, '[1]', dimensions[0]).id,
                name: _.get(dimensions, '[1]', dimensions[0]).name,
                dimensionName: _.get(dimensions, '[1]', dimensions[0]).dimensionName,
            } : undefined;
        }
        
        return sankey;
    }
    
    getBulletJson() {
        return {
            valueRanges: _.get(this.settings, 'bullet.valueRanges', []),
        };
    }
    
    getTreemapJson() {
        return {
            layoutAlgorithm: _.get(this.settings, 'treemap.layoutAlgorithm', 'squarified'),
            layoutStartingDirection: _.get(this.settings, 'treemap.layoutStartingDirection', 'vertical'),
        };
    }
    
    getMetricsJson(includeHidden = true) {
        let items = this.settings.metrics.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            hidden: item.hidden,
            leftYAxis: item.leftYAxis,
            goal: item.goal,
            chartType: item.chartType,
            useSymbols: item.useSymbols,
        }));
        
        // Add missing metrics from card at the end of column positions
        this.card.metrics.items.forEach((item, index) => {
            let exists = items.find(metric => {
                return metric.id === this.card.metrics.getMetricId(item) && metric.type === this.card.metrics.getMetricType(item);
            });
            
            // Skip hidden metrics if not requested
            if(!includeHidden && item.isHidden()) return;
            
            !exists && items.push({
                id: this.card.metrics.getMetricId(item),
                name: item.label,
                type: this.card.metrics.getMetricType(item),
                hidden: !! item.isHidden(),
                leftYAxis: true,
                goal: 0,
                chartType: 'line',
                useSymbols: false,
            });
        });
        
        // Remove metrics and dimensions that doesn't exist on card level
        items = items.filter(metric => {
            return this.card.metrics.items.find(item => {
                return metric.id === this.card.metrics.getMetricId(item);
            });
        });
        
        if(!includeHidden) {
            items = items.filter(item => !item.hidden);
        }
        
        return items;
    }
    
    hasMetricsOnLeftYAxis() {
        return this.settings.metrics.find(metric => metric.leftYAxis);
    }
    
    hasMetricsOnRightYAxis() {
        return this.settings.metrics.find(metric => !metric.leftYAxis);
    }
    
    isLeftYAxisVisible() {
        return (new HighchartCardType(this.card)).hasYAxis() && this.hasMetricsOnLeftYAxis() && this.settings.leftYAxis.show;
    }
    
    isRightYAxisVisible() {
        return (new HighchartCardType(this.card)).hasYAxis() && this.hasMetricsOnRightYAxis() && this.settings.rightYAxis.show;
    }
    
    metricIsOnLeftYAxis(id) {
        let metric = this.settings.metrics.find(metric => metric.id === id);
        
        return metric ? metric.leftYAxis : false;
    }
    
    metricIsOnRightYAxis(id) {
        let metric = this.settings.metrics.find(metric => metric.id === id);
    
        return metric ? !metric.leftYAxis : false;
    }
    
    metricGoal(id) {
        let metric = this.settings.metrics.find(metric => metric.id === id);
        let goal = parseFloat(_.get(metric, 'goal', 0));
        
        return _.isNumber(goal) ? goal : 0;
    }
    
    metricChartType(id) {
        let metric = this.settings.metrics.find(metric => metric.id === id);
    
        return metric ? metric.chartType : 'line';
    }
    
    metricIsUsingSymbols(id) {
        let metric = this.settings.metrics.find(metric => metric.id === id);
    
        return metric ? metric.useSymbols : false;
    }
    
    fillMissingWithDefaults() {
        this.settings = _.defaults(this.settings, {
            fillChart: this.card.fillChart,
            stacked: false,
            spider: {
                type: 'polygon',
                enabled: false,
            },
            legend: {
                show: true,
            },
            valueLabels: {
                show: this.card.showValueLabels,
            },
            xAxis: {
                label: '',
                show: true,
            },
            leftYAxis: {
                label: '',
                autoLabel: false,
                show: true,
                autoScale: true,
                range: false,
                rangeFrom: undefined,
                rangeTo: undefined,
            },
            rightYAxis: {
                label: '',
                autoLabel: false,
                show: this.card.multipleAxis,
                autoScale: true,
                range: false,
                rangeFrom: undefined,
                rangeTo: undefined,
            },
            metrics: [],
        });
    }
}
