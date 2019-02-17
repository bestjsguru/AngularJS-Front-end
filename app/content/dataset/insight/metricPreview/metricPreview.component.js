'use strict';

import {Helpers} from '../../../common/helpers.js';
import {MetricCollection} from '../../../card/model/metric.collection.js';

const LONG_TABLE_COLUMNS = 7;

class MetricPreviewCtrl {
    constructor(DataProvider, toaster, Auth, UserService, DateRangeService, $filter, $element) {
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

        this.dateFormatFn = Helpers.formatDate('Monthly', {withYear: true});
    }
    
    $onInit() {
        this.metric = this.resolve.metric;
    
        this.getTableData();
    }

    getTableData(currentPage = 1) {
        this.loaded = false;
    
        if(!this.metric.id) return;
        
        let params = {
            metricId: this.metric.id,
            sortField: this.metric.getDateFieldIndex(),
            page: currentPage,
        };

        return this.DataProvider.get('card/existingCard', params, this.useCache).then((response) => {

            this.metrics = [];
            this.data = response.data;
    
            if(!this.data.results.length) {
                this.toaster.info('There are no more results to show');
                return this.getTableData(this.page);
            }
            
            response.metrics.forEach((metric) => {
                this.metrics.push(MetricCollection.create(metric, undefined, this.DateRangeService, this.Auth, this.UserService));
            });

            // Save current page
            this.page = currentPage;

            return this.generateTableData();

        }).catch((error) => {
            this.metricData = {};
            console.error('Error loading metric:', this.metric.id, error.message);
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
        if (!this.metricData.columns.length && this.metric.getDateFieldIndex() === 0 && this.metric.info.dateColumn) {
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
        return this.metric && !this.loaded;
    }
    
    get total() {
        return this.metricData.currentPage * 20 + 1;
    }

    changePage() {
        this.getTableData(this.metricData.currentPage);
    }

    isOnePageOnly() {
        if (!this.metricData) return true;

        return this.metricData.currentPage === 1 && this.metricData.total < 20;
    }

    showPagination(){
        return this.loaded && this.metricData.total && !this.isOnePageOnly();
    }
}

truedashApp.component('appMetricPreview', {
    controller: MetricPreviewCtrl,
    templateUrl: 'content/dataset/insight/metricPreview/metricPreview.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
