'use strict';

import './keyDrivers.service';
import './drill/table/keyDriversDrillTable.component';
import './topReasons/keyDriversTopReasons.component';
import './dimensions/keyDriversDimensions.component';
import './filters/button/keyDriversFilterButton.component';

class KeyDriversCtrl {

    constructor(KeyDriversImpactFactory, KeyDriversService, DeregisterService, MetricService, $scope, $rootScope, $window, $state, $filter) {
        this.$state = $state;
        this.$window = $window;
        this.$filter = $filter;
        this.$rootScope = $rootScope;
        this.MetricService = MetricService;
        this.KeyDriversImpactFactory = KeyDriversImpactFactory;
        this.KeyDriversService = KeyDriversService;
        this.watchers = DeregisterService.create($scope);

        this.type = 'table';

        this.metrics = [];
        this.actualMetric = null;
        this.numberOfTopReasons = 20;
        this.filters = [];
        this.impacts = [];
        this.dimension = {manualMode: false, items: []};
        this.loading = false;
        this.isError = false;
        this.collapsed = false;
        
        this.date = this.$state.params.date;
        this.date.fromDate = moment(this.date.fromDate || +moment().subtract(1, 'd').startOf('day'));
        this.date.toDate = moment(this.date.toDate || +moment().subtract(1, 'd').endOf('day'));

        this.hiddenLabels = ['allTime', 'cardDateRange', 'last7Days', 'last30Days', 'last4Weeks',
                             'last3Months', 'last6Months', 'last12Months'];
    
        this.watchers.watch('$ctrl.$state.params.actualMetricId', (id) => {
            this.loadMetrics().then(() => {
                if(id) {
                    this.actualMetric = this.metrics.find(metric => metric.id === parseInt(id));
                    this.onMetricSelect();
                }
            });
        });
    }
    
    loadMetrics(useCache = true) {
        this.metricsAreLoading = true;
        
        return this.MetricService.getList(useCache).then(metrics => {
            this.metrics = metrics;
        }).finally(() => {
            this.metricsAreLoading = false;
        });
    }

    $onInit() {
        this.watchers.onRoot('keyDriversWaterfall.point.click', (event, impact, filterColumn, filterValue) => {
            impact && this.drillDown(impact, filterColumn, filterValue);
        });
        
        this.watchers.onRoot('keyDrivers.filter.created', (event, filter) => {
            this.filters.push(filter);
            this.$rootScope.$broadcast('keyDrivers.filters.changed', this.filters);
        });
    
        this.watchers.onRoot('keyDrivers.filter.updated', (event, filter) => {
            this.filters = this.filters.map(item => {
                if(item.id === filter.id) item = filter;
            
                return item;
            });
            this.$rootScope.$broadcast('keyDrivers.filters.changed', this.filters);
        });
    
        this.watchers.onRoot('keyDrivers.filter.deleted', (event, filter) => {
            this.filters = this.filters.filter(item => item.id !== filter.id);
            this.$rootScope.$broadcast('keyDrivers.filters.changed', this.filters);
        });
    }

    drillDown(impact, filterColumn, filterValue) {
        this.watchers.timeout(() => {
            this.drill = {
                impact: this.impacts.getById(impact.id),
                filterColumn: filterColumn,
                filterValue: filterValue
            };
        });
    }

    drillUp() {
        this.drill = null;
    }

    setType(type) {
        this.type = type;
    }

    updateDates(dates, range) {
        this.date = {
            fromDate: moment(dates.startDate),
            toDate: moment(dates.endDate),
            rangeName: range
        };
        
        this.refreshUrl();
    }
    
    onMetricSelect() {
        this.$rootScope.$broadcast('keyDrivers.metric.selected', {
            actual: this.actualMetric,
        });
        
        this.refreshUrl();
    }
    
    refreshUrl() {
        this.$state.go('.', this.getJson(), {notify: false});
    }

    calculate() {
        if(this.form.$invalid) return;

        this.loading = true;
        this.isError = false;

        this.KeyDriversService.getImpacts(this.getJson()).then(impacts => {
            this.topReasons = impacts.top_reasons;
            this.impacts = this.KeyDriversImpactFactory.create(impacts);
            this.totalVariance = {
                actual: this.$filter('value')(impacts.total.actual.toFixed(2), {symbol: this.impacts.actual.symbol}, false),
            };
    
            this.$rootScope.$broadcast('keyDrivers.calculate.finished', {
                actualMetric: this.getJson().actualMetricId,
                impacts: impacts
            });
        }).catch((error) => {
            this.isError = true;
        }).finally(() => {
            this.loading = false;
        });
    }
    
    getJson() {
        return {
            numberOfTopReasons: this.numberOfTopReasons || 20,
            actualMetricId: this.actualMetric && this.actualMetric.id,
            date: {
                fromDate: +this.date.fromDate,
                toDate: +this.date.toDate,
                rangeName: this.date.rangeName
            },
            filters: this.filters,
            dimensions: !this.dimension.manualMode ? [] : this.dimension.items.filter(item => item.selected).map(item => {
                return {
                    columnId: item.columnId,
                    tableId: item.tableId,
                    name: item.name,
                }
            })
        };
    }
    
    getDateString() {
        return `${this.date.fromDate.format('MMMM Do, YYYY')} - ${this.date.toDate.format('MMMM Do, YYYY')}`;
    }

    showData() {
        return this.hasMetrics() && !this.isError && !this.loading && this.impacts.length;
    }

    showDrill() {
        return this.drill;
    }

    showPreview() {
        return this.hasMetrics() && !this.isError && !this.loading && !this.impacts.length;
    }

    showError() {
        return this.isError && !this.loading;
    }

    hasMetrics() {
        return this.metrics && this.metrics.length;
    }

    toggleSidebar() {
        this.collapsed = !this.collapsed;

        // Trigger window resize so cards can resize accordingly
        angular.element(this.$window).trigger('resize');
    }
}

truedashApp.component('appKeyDrivers', {
    controller: KeyDriversCtrl,
    templateUrl: 'content/machineLearning/keyDrivers/keyDrivers.html'
});
