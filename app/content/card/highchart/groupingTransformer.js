'use strict';

export default class GroupingTransformer {
    constructor(card) {
        this.card = card;
        this.metrics = this.card.metrics.getVisibleMetrics();
        this.originalData = this.card.metrics.originalData;
    }

    getMetrics() {
        if(!this.card.groupings.length) return this.metrics;
        if(!this.originalData.results) return [];
        
        if(!this.card.frequencies.isTotalSelected() || ['pie', 'donut', 'funnel'].includes(this.card.types.get())) {
            return this.getRegularMetrics();
        }
        
        if(this.card.isTransposeTable) {
            return this.getDimensionsGroupedByMetrics();
        }
        
        return this.getMetricsGroupedByDimensions();
    }
    
    getRegularMetrics() {
        let numberOfGroups = this.originalData.columns.filter(column => column.title).length;

        let metrics = [];
        this.originalData.results.forEach(columnData => {
            let groupings = this.card.groupings.getSortedGroupings().map((grouping, index) => {
                grouping = grouping.getJson();
                grouping.value = columnData[index];
        
                return grouping;
            });
    
            let columnName = columnData.slice(0, this.card.drill.isActive() ? 1 : numberOfGroups).join(", ");
            let metricsData = new Map();
            let metricsGroupings = new Map();

            columnData.forEach((value, index) => {
                if(index < numberOfGroups) return;

                let metric = this.card.metrics.getByColumnDesc(this.originalData.columns[index]);
                if (this.metrics.includes(metric)) {
                    let data = metricsData.get(metric) || [];
                    data.push([this.originalData.columns[index].time, value]);
                    metricsData.set(metric, data);
                    metricsGroupings.set(metric, groupings);
    
                }
            });

            metricsData.forEach((data, metric) => {
                let chartMetric = this.card.metrics.create(metric.getJson(), data);
                chartMetric.setName(this.metrics.length === 1 ? columnName : chartMetric.label + "-" + columnName, true);
    
                chartMetric.groupings = metricsGroupings.get(metric);
    
                metrics.push(chartMetric);
            });
        });
        
        return metrics;
    }
    
    getMetricsGroupedByDimensions() {
        let metrics = [];
        let metricsData = new Map();
        let metricsInfo = [];
        
        let numberOfGroups = this.originalData.columns.filter(column => column.title).length;
    
        this.originalData.results.forEach(columnData => {
            columnData.forEach((value, index) => {
                if(index < numberOfGroups) return;
            
                let metric = this.card.metrics.getByColumnDesc(this.originalData.columns[index]);
                let metricId = metric.virtualId || metric.id;
            
                if(this.metrics.includes(metric)) {
                    let data = metricsData.get(metricId) || [];
                    data.push([this.originalData.columns[index].time, value]);
                    metricsData.set(metricId, data);
                    metricsInfo[metricId] = metric;
                }
            });
        
        });
        
        metricsData.forEach((data, metricId) => {
            // We can only sort by values in case of single metric. We will not sort scatter or bubble chart data
            if(metricsData.size === 1 && !['scatter', 'bubble'].includes(this.card.types.get())) data.sort((a, b) => b[1] - a[1]);
            
            metrics.push(this.card.metrics.create(metricsInfo[metricId].getJson(), data));
        });
        
        return metrics;
    }
    
    getDimensionsGroupedByMetrics(selectedMetrics = this.metrics) {
        let metrics = [];
        let metricsData = new Map();
        let metricsGroupings = new Map();
        let metricsInfo = [];
    
        let numberOfGroups = this.originalData.columns.filter(column => column.title).length;
    
        this.originalData.results.forEach(columnData => {
            let groupings = this.card.groupings.getSortedGroupings().map((grouping, index) => {
                grouping = grouping.getJson();
                grouping.value = columnData[index];
        
                return grouping;
            });
    
            let columnName = columnData.slice(0, numberOfGroups).join(", ");
            
            columnData.forEach((value, index) => {
                if(index < numberOfGroups) return;
            
                let metric = this.card.metrics.getByColumnDesc(this.originalData.columns[index]);
                if(selectedMetrics.includes(metric)) {
                    let data = metricsData.get(columnName) || [];
                    data.push([this.originalData.columns[index].time, value]);
                    metricsData.set(columnName, data);
                    metricsInfo[columnName] = metric;
                    metricsGroupings.set(columnName, groupings);
                }
            });
        });
    
        metricsData.forEach((data, columnName) => {
            // We can only sort by values in case of single metric. We will not sort scatter or bubble chart data
            if(metricsData.size === 1 && !['scatter', 'bubble'].includes(this.card.types.get())) data.sort((a, b) => b[1] - a[1]);
            
            let chartMetric = this.card.metrics.create(metricsInfo[columnName].getJson(), data);
            chartMetric.setName(columnName, true);
    
            chartMetric.groupings = metricsGroupings.get(columnName);
    
            // We remove any color reference and let dimensions pick up default colors
            chartMetric.color = null;
            
            metrics.push(chartMetric);
        });
    
        return metrics;
    }
    
    getSingleDimensionGroupedByMetrics(id, selectedMetrics = this.metrics) {
        let metrics = [];
        let metricsData = new Map();
        let metricsGroupings = new Map();
        let metricsInfo = [];
    
        let numberOfGroups = this.originalData.columns.filter(column => column.title).length;
        let dimensionIndex = this.originalData.columnPosition.findIndex(position => {
            return position.id === id && position.type === 'dimension';
        });
        
        this.originalData.results.forEach(columnData => {
            let groupings = this.card.groupings.getSortedGroupings().map((grouping, index) => {
                grouping = grouping.getJson();
                grouping.value = columnData[index];
        
                return grouping;
            });
    
            let columnName = columnData.slice(dimensionIndex, dimensionIndex + 1).join(", ");
            let groupingName = _.without(columnData.slice(0, numberOfGroups), columnData[dimensionIndex]).join(", ") || columnName;
    
            columnData.forEach((value, index) => {
                if(index < numberOfGroups) return;
        
                let metric = this.card.metrics.getByColumnDesc(this.originalData.columns[index]);
                if(selectedMetrics.includes(metric)) {
                    let data = metricsData.get(columnName) || [];
                    data.push([groupingName, value]);
                    metricsData.set(columnName, data);
                    metricsInfo[columnName] = metric;
                    metricsGroupings.set(columnName, groupings);
                }
            });
        });
    
        metricsData.forEach((data, columnName) => {
            // We can only sort by values in case of single metric. We will not sort scatter or bubble chart data
            if(metricsData.size === 1 && !['scatter', 'bubble'].includes(this.card.types.get())) data.sort((a, b) => b[1] - a[1]);
            
            let chartMetric = this.card.metrics.create(metricsInfo[columnName].getJson(), data);
            chartMetric.setName(columnName, true);
    
            chartMetric.groupings = metricsGroupings.get(columnName);
    
            // We remove any color reference and let dimensions pick up default colors
            chartMetric.color = null;
            
            metrics.push(chartMetric);
        });
    
        return metrics;
    }
    
    getGroupingCategories() {
        if(this.card.isTransposeTable) {
            return this.metrics.map(metric => metric.label);
        }
        
        let items = [];
        
        if (!this.card.groupings.length || !this.originalData.columns) return items;
        
        let numberOfGroups = this.originalData.columns.filter(column => column.title).length;
        let numberOfMetrics = this.originalData.columns.length - numberOfGroups;
        
        // If we have only one metric we will sort by value in descending order
        if(numberOfMetrics === 1) {
            this.originalData.results.sort((a, b) => b[numberOfGroups] - a[numberOfGroups]);
        }
        
        this.originalData.results.forEach(columnData => {
            items.push(columnData.slice(0, this.card.drill.isActive() ? 1 : numberOfGroups).join(", "));
        });
        
        return _.without(_.uniq(items), '');
    }
    
    getDataPointGroupings(dataPointIndex) {
        let items = [];
        
        if (!this.card.groupings.length || !this.originalData.columns) return items;
        
        let numberOfGroups = this.originalData.columns.filter(column => column.title).length;
        let numberOfMetrics = this.originalData.columns.length - numberOfGroups;
        
        // If we have only one metric we will sort by value in descending order
        if(numberOfMetrics === 1) {
            this.originalData.results.sort((a, b) => b[numberOfGroups] - a[numberOfGroups]);
        }
    
        let columnData = _.get(this.originalData.results, `[${dataPointIndex}]`, []);
        
        // If there are no original results for that datapoint we will return nothing
        if(!columnData.length) return items;
        
        items = this.card.groupings.getSortedGroupings().map((grouping, index) => {
            grouping = grouping.getJson();
            grouping.value = columnData[index];
        
            return grouping;
        });
        
        return items;
    }
    
    getGroupingSets() {
        let items = [];

        if (!this.card.groupings.length) return items;

        let numberOfGroups = this.originalData.columns.filter(column => column.title).length;
    
        this.originalData.results.forEach(columnData => {
            items.push(columnData.slice(0, numberOfGroups - 1).join(", "));
        });

        return _.without(_.uniq(items), '');
    }
}
