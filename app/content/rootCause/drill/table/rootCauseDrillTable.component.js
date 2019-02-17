'use strict';

import '../metricValue/rootCauseMetricValue.component';

class RootCauseDrillTableCtrl {

    constructor($filter, $rootScope) {
        this.$filter = $filter;
        this.$rootScope = $rootScope;

        this.pagination = {
            itemsPerPage: 25,
            currentPage: 1,
            totalItems: 0,
            rows: []
        };
    }

    $onInit() {
        this.reverse = true;
        this.goal = this.impacts.goal;
        this.dimensionsLength = this.drill.impact.drillDown.dimensions.length + 1;

        this.refreshTable();
    }

    refreshTable() {
        this.generateTable();
        this.paginate();

        // Default order by goal metric
        this.reverse = this.drill.impact.value.impact <= 0;
        this.orderBy(this.dimensionsLength);
    }

    showPagination() {
        return this.pagination.totalItems > this.pagination.itemsPerPage;
    }

    paginate() {
        // Reset array indexes and filter out undefined values
        this.rows = this.rows.filter(() => true);

        this.pagination.totalItems = this.rows.length;

        this.pagination.rows = this.rows.slice((this.pagination.currentPage - 1) * this.pagination.itemsPerPage, this.pagination.currentPage * this.pagination.itemsPerPage);
        window.scrollTo(0, 0);
    }

    orderBy(index) {
        this.pagination.currentPage = 1;

        this.orderColumn = `column${index}.value`;
        this.reverse = !this.reverse;

        this.rows = this.$filter('orderBy')(this.rows, this.orderColumn, this.reverse);
        this.paginate();
    }

    orderedBy(index) {
        return this.orderColumn === `column${index}.value`;
    }

    getFilteredIndexes() {

        if(!this.hasFilter()) return [];

        let item = this.drill.impact.drillDown.dimensions.find(dimension => dimension.name.toLowerCase() === this.drill.filterColumn.toLowerCase());

        if(!item) return [];

        return item.values.reduce((indexes, value, index) => {
            if(value === this.drill.filterValue) indexes.push(index);
            return indexes;
        }, []);
    }

    hasFilter() {
        return this.drill.filterColumn && this.drill.filterValue;
    }

    clearFilter() {
        this.drill.filterColumn = this.drill.filterValue = undefined;

        this.refreshTable();
    }

    generateTable() {

        this.headers = [];
        this.rows = [];
    
        let indexes = this.getFilteredIndexes();
        
        // Add like for like column
        this.headers.push({name: 'LFL'});
        this.drill.impact.drillDown.likeForLike.forEach((value, index) => {
            if(indexes.length && !indexes.includes(index)) return;
        
            if (!_.isObject(this.rows[index])) this.rows[index] = {};
        
            this.rows[index]['column' + 0] = {
                value: value ? `<i class="fa fa-fw fa-check text-success"></i>` : ``,
                isIncrease: false,
                isMetric: false,
                isDrill: false,
                isGood: false,
                metric: {},
                index: index,
            };
        });
        
        // Add dimension columns
        this.drill.impact.drillDown.dimensions.forEach((dimension, dimensionIndex) => {
            this.headers.push({name: dimension.name});
            dimension.values.forEach((value, index) => {
                if(indexes.length && !indexes.includes(index)) return;

                if (!_.isObject(this.rows[index])) this.rows[index] = {};

                this.rows[index]['column' + dimensionIndex + 1] = this.getValueObject(value);
                this.rows[index]['column' + dimensionIndex + 1].index = index;
            });
        });

        // Add metrics (driver and goal metrics)
        this.headers.push({name: this.goal.metric.name});
        !this.isGoalMetric && this.headers.push({name: this.drill.impact.metric.name});

        this.goal.drillDown.diff.forEach((value, index) => {
            if(indexes.length && !indexes.includes(index)) return;

            if (!_.isObject(this.rows[index])) this.rows[index] = {};


            this.rows[index]['column' + this.dimensionsLength] = this.getValueObject(value, true, false, this.goal.metric);
            this.rows[index]['column' + this.dimensionsLength].percent = this.getPercent(value, this.goal.drillDown.diff);
            this.rows[index]['column' + this.dimensionsLength].index = index;
        });

        !this.isGoalMetric && this.drill.impact.drillDown.diff.forEach((value, index) => {
            if(indexes.length && !indexes.includes(index)) return;

            if (!_.isObject(this.rows[index])) this.rows[index] = {};

            this.rows[index]['column' + (this.dimensionsLength + 1)] = this.getValueObject(value, true, true, this.drill.impact.metric);
            this.rows[index]['column' + (this.dimensionsLength + 1)].percent = this.getPercent(value, this.drill.impact.drillDown.diff);
            this.rows[index]['column' + (this.dimensionsLength + 1)].index = index;
        });
    }

    get isGoalMetric() {
        return this.goal.metric.id === this.drill.impact.metric.id;
    }

    getValueObject(value, isMetric = false, isDrill = false, metric = {}) {
        let valueObject = {
            value: value,
            isMetric: isMetric,
            isDrill: isDrill,
            metric: metric,
        };

        if(isMetric && isDrill) {
            valueObject.formattedValue = this.$filter('value')(value, {symbol: this.drill.impact.symbol}, true, true);
            valueObject.isIncrease = this.drill.impact.isIncrease;
            valueObject.isGood = value > 0 && this.drill.impact.isIncrease || value <= 0 && !this.drill.impact.isIncrease;
        }
        
        if(isMetric && !isDrill) {
            valueObject.formattedValue = this.$filter('value')(value, {symbol: this.goal.symbol}, true, true);
            valueObject.isIncrease = this.goal.isIncrease;
            valueObject.isGood = value > 0 && this.goal.isIncrease || value <= 0 && !this.goal.isIncrease;
        }

        return valueObject;
    }

    getPercent(value, diff) {
        if(!value) return 0;

        let maxValue = diff.reduce((max, item) => {
            item = Math.abs(item);

            if(item > max) return item;

            return max;
        }, 0);

        return parseInt(Math.abs(value) / maxValue * 100);
    }
}

truedashApp.component('appRootCauseDrillTable', {
    controller: RootCauseDrillTableCtrl,
    templateUrl: 'content/rootCause/drill/table/rootCauseDrillTable.html',
    bindings: {
        impacts: '=',
        drill: '=',
        scroller: '='
    }
});
