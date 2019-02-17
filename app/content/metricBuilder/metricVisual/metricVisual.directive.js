'use strict';

import {Helpers} from '../../common/helpers.js';
import {MetricCollection} from '../../card/model/metric.collection.js';

const LONG_TABLE_COLUMNS = 7;

class MetricVisualController {
    constructor($scope, $q, DeregisterService, DataProvider, toaster, Auth, UserService, DateRangeService, $filter, $element) {
        this.$q = $q;
        this.toaster = toaster;
        this.$filter = $filter;
        this.$element = $element;
        this.loaded = false;
        this.data = [];
        this.metrics = [];
        this.metricData = {};
        this.DataProvider = DataProvider;
        this.DateRangeService = DateRangeService;
        this.Auth = Auth;
        this.UserService = UserService;
        this.page = 1;
        this.useCache = false;

        this.dateFormatFn = Helpers.formatDate('Weekly', {withYear: true});

        this.watchers = DeregisterService.create($scope);
        this.watchers.watch('mv.metricBuilder.metricList.selectedMetric', (metric) => {
            if(metric.id !== undefined) return this.getTableData(metric);
        });
    }

    getTableData(metric, currentPage = 1) {
        this.loaded = false;

        return this.DataProvider.get('card/existingCard', {metricId: metric.id, sortField: metric.getDateFieldIndex(), page: currentPage}, this.useCache).then((response) => {

            // In case multiple requests are loading in parallel we make sure only correct one is updated
            if(this.metricBuilder.metricList.selectedMetric.id != metric.id) return;

            this.metrics = [];
            this.data = response.data;
            response.metrics.forEach((metric) => {
                this.metrics.push(MetricCollection.create(metric, undefined, this.DateRangeService, this.Auth, this.UserService));
            });

            // Save current page
            this.page = currentPage;

            return this.generateTableData();

        }).catch((error) => {
            this.metricData = {};
            console.error('Error loading metric:', this.metricBuilder.metricList.selectedMetric.id, error.message);
            this.toaster.error(error.message);
        }).finally(() => {
            this.loaded = true;
            this.$element.find('.scroller-y').perfectScrollbar('update');
        });
    }

    generateTableData() {

        var columnsVisibility = [];
        var columnsFormatFn = [];
        this.metricData.columns = [];
        this.metricData.total = this.data.total || 0;
        this.metricData.currentPage = this.page;

        // test to see if the first column is a date
        if (!this.metricData.columns.length &&
            this.metricBuilder.metricList.selectedMetric.getDateFieldIndex() === 0 &&
            this.metricBuilder.metricList.selectedMetric.info.dateColumn) {
            this.metricData.columns.push('Date');
        }

        this.metrics.forEach(metric => {
            var info = metric.getFormattingInfo();

            metric.columns.forEach((column, index) => {
                if (metric.getDateFieldIndex() == index && metric.info.dateColumn) {
                    columnsFormatFn.push(this.dateFormatFn);
                } else {
                    // Format numeric value, and leave all non-numeric values same
                    columnsFormatFn.push(value => {
                        if(Helpers.shouldBeFormatedAsDate(value, column.title)) return this.dateFormatFn(value);
                        if(Helpers.shouldBeFormatedAsNumeric(value, column.title)) return this.$filter('value')(value, info, false, false, metric.numberOfDecimals);
                        return value;
                    });
                }

                column.title != 'Date' && this.metricData.columns.push(column.title);
                columnsVisibility.push(!metric.isHidden());
            });
        });

        // Remove hidden metric columns
        this.metricData.columns = this.metricData.columns.reduce((res, col, idx) => {
            if (columnsVisibility[idx]) res.push(col);
            return res;
        }, []);

        // And format result values
        this.metricData.results = this.data.results.map(row => row.reduce((res, val, idx) => {
            if (columnsVisibility[idx]) res.push(columnsFormatFn[idx](val));
            return res;
        }, []));

        this.metricData.longTable = this.metricData.columns.length > LONG_TABLE_COLUMNS;

        return this.metricData;
    }

    showLoader() {
        return this.metricBuilder && this.metricBuilder.metricList.selected && !this.loaded;
    }

    showPreview() {
        return this.metricBuilder && !this.metricBuilder.metricList.selected;
    }

    changePage() {
        this.getTableData(this.metricBuilder.metricList.selectedMetric, this.metricData.currentPage);
    }

    isOnePageOnly() {
        if (!this.metricData) return true;

        let results = this.metricData.results;
        let total = this.metricData.total;

        return !results || !results.length || !total || results.length >= total;
    }

    showPagination(){
        return this.loaded && this.metricData.total && !this.isOnePageOnly();
    }
}

truedashApp.directive('tuMetricVisual', () => {
    return {
        controller: MetricVisualController,
        restrict: 'E',
        templateUrl: 'content/metricBuilder/metricVisual/metricVisual.html',
        bindToController: true,
        controllerAs: 'mv',
        require: '^tuMetricBuilder',
        link: function(scope, element, attrs, metricBuilder) {
            scope.mv.metricBuilder = metricBuilder;
            metricBuilder.affectedPeople = scope.mv;
        }
    };
});
