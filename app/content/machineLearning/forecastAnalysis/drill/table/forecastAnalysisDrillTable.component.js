'use strict';

class ForecastAnalysisDrillTableCtrl {

    constructor($filter) {
        this.$filter = $filter;

        this.pagination = {
            itemsPerPage: 25,
            currentPage: 1,
            totalItems: 0,
            rows: []
        };
    }

    $onInit() {
        this.reverse = true;
        this.dimensionsLength = this.drill.impact.drillDown.dimensions.length;

        this.refreshTable();
    }

    refreshTable() {
        this.generateTable();
        this.paginate();

        // Default order
        this.reverse = !this.drill.impact.isIncrease;
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
        
        // Add dimension columns
        this.drill.impact.drillDown.dimensions.forEach((dimension, dimensionIndex) => {
            this.headers.push({name: dimension.name});
            dimension.values.forEach((value, index) => {
                if(indexes.length && !indexes.includes(index)) return;

                if (!_.isObject(this.rows[index])) this.rows[index] = {};

                this.rows[index]['column' + dimensionIndex] = this.getValueObject(value);
            });
        });

        // Add metric values
        this.headers.push({name: 'Variance'});
        this.headers.push({name: 'Actual'});
        this.headers.push({name: 'Forecast'});
    
        this.drill.impact.drillDown.variance.forEach((value, index) => {
            if(indexes.length && !indexes.includes(index)) return;

            if (!_.isObject(this.rows[index])) this.rows[index] = {};

            this.rows[index]['column' + this.dimensionsLength] = this.getValueObject(value, true, true);
        });
        
        this.drill.impact.drillDown.actual.forEach((value, index) => {
            if(indexes.length && !indexes.includes(index)) return;

            if (!_.isObject(this.rows[index])) this.rows[index] = {};

            this.rows[index]['column' + (this.dimensionsLength + 1)] = this.getValueObject(value, true, false);
        });
        
        this.drill.impact.drillDown.forecast.forEach((value, index) => {
            if(indexes.length && !indexes.includes(index)) return;

            if (!_.isObject(this.rows[index])) this.rows[index] = {};

            this.rows[index]['column' + (this.dimensionsLength + 2)] = this.getValueObject(value, true, false);
        });
    }

    getValueObject(value, isMetric = false, useColors = false) {
        let valueObject = {
            value: value,
            isIncrease: value > 0,
            isMetric: isMetric,
            useColors: useColors,
        };

        if(isMetric) valueObject.formattedValue = this.$filter('value')(value, {symbol: this.drill.impact.symbol}, true, true);

        return valueObject;
    }

    itemClass(item) {
        let classList = [];
        if(!item.isMetric) return classList;

        if(item.useColors && item.isIncrease) classList.push('text-success');
        if(item.useColors && !item.isIncrease) classList.push('text-danger');

        return classList;
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

truedashApp.component('appForecastAnalysisDrillTable', {
    controller: ForecastAnalysisDrillTableCtrl,
    templateUrl: 'content/machineLearning/forecastAnalysis/drill/table/forecastAnalysisDrillTable.html',
    bindings: {
        drill: '=',
        scroller: '='
    }
});
