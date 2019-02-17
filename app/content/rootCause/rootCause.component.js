'use strict';

import './rootCause.service';
import './waterfall/rootCauseWaterfall.component';
import './table/rootCauseTable.component';
import './drill/table/rootCauseDrillTable.component';
import './topReasons/rootCauseTopReasons.component';
import './dimensions/rootCauseDimensions.component';
import './filters/button/rootCauseFilterButton.component';
import './digest/rootCauseDigest.component';

class RootCauseCtrl {

    constructor(ImpactFactory, RootCauseService, DeregisterService, $scope, $rootScope, $window, $state, $filter, AppEventsService) {
        this.$state = $state;
        this.$filter = $filter;
        this.$window = $window;
        this.$rootScope = $rootScope;
        this.ImpactFactory = ImpactFactory;
        this.AppEventsService = AppEventsService;
        this.RootCauseService = RootCauseService;
        this.watchers = DeregisterService.create($scope);

        this.type = 'waterfall';

        this.metrics = [];
        this.filters = [];
        this.impacts = [];
        this.dimension = {manualMode: false, items: []};
        this.loading = false;
        this.isError = false;
        this.collapsed = false;
    
        this.autoCalculate = this.$state.params.autoCalculate === 'true';

        this.previous = _.cloneDeep(this.$state.params.previous);
        this.previous.fromDate = moment(this.previous.fromDate || +moment().subtract(8, 'd').startOf('day'));
        this.previous.toDate = moment(this.previous.toDate || +moment().subtract(8, 'd').endOf('day'));

        this.current = _.cloneDeep(this.$state.params.current);
        this.current.fromDate = moment(this.current.fromDate || +moment().subtract(1, 'd').startOf('day'));
        this.current.toDate = moment(this.current.toDate || +moment().subtract(1, 'd').endOf('day'));
        
        if(this.$window.isDemo) {
            this.previous = {
                fromDate: moment('2017-04-05 00:00:00'),
                toDate: moment('2017-04-05 23:59:59'),
                rangeName: 'custom'
            };
    
            this.current = {
                fromDate: moment('2017-04-12 00:00:00'),
                toDate: moment('2017-04-12 23:59:59'),
                rangeName: 'custom'
            };
    
            if(!this.$state.params.relationId) {
                this.loadMetrics().then(() => {
                    this.metrics.selected = this.metrics[0];
                    this.refreshUrl();
                });
            }
        }

        this.hiddenLabels = ['allTime', 'cardDateRange', 'last7Days', 'last30Days', 'last4Weeks',
                             'last3Months', 'last6Months', 'last12Months'];

        this.hiddenPreviousLabels = [...this.hiddenLabels, 'today', 'week', 'month', 'quarter', 'year', 'fiscalYear'];

        this.watchers.watch('$ctrl.$state.params.relationId', (id, oldId) => {
            this.loadMetrics().then(() => {
                if(id) {
                    this.metrics.selected = this.metrics.find(metric => metric.id === parseInt(id));
                    this.$rootScope.$broadcast('rootCause.relation.selected', this.metrics.selected);

                    this.watchers.timeout(() => {
                        let firstLoad = id === oldId;
                        
                        if(firstLoad && this.autoCalculate) {
                            this.collapsed = true;
                            this.calculate();
                        }
                    });
                }
            });
        });
    }
    
    loadMetrics() {
        this.metricsAreLoading = true;
        return this.RootCauseService.getAvailableMetrics().then(metrics => {
            this.metrics = metrics;
        }).finally(() => this.metricsAreLoading = false);
    }

    $onInit() {
        this.watchers.onRoot('rootCauseWaterfall.point.click', (event, impact, filterColumn, filterValue) => {
            impact && this.drillDown(impact, filterColumn, filterValue);
        });
    
        this.watchers.onRoot('rootCause.filter.created', (event, filter) => {
            this.filters.push(filter);
            this.$rootScope.$broadcast('rootCause.filters.changed', this.filters);
        });
    
        this.watchers.onRoot('rootCause.filter.updated', (event, filter) => {
            this.filters = this.filters.map(item => {
                if(item.id === filter.id) item = filter;
            
                return item;
            });
            this.$rootScope.$broadcast('rootCause.filters.changed', this.filters);
        });
    
        this.watchers.onRoot('rootCause.filter.deleted', (event, filter) => {
            this.filters = this.filters.filter(item => item.id !== filter.id);
            this.$rootScope.$broadcast('rootCause.filters.changed', this.filters);
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

    updatePreviousDates(dates, range) {
        this.previous = {
            fromDate: moment(dates.startDate),
            toDate: moment(dates.endDate),
            rangeName: range
        };
    
        this.refreshUrl();
    }

    updateCurrentDates(dates, range) {
        this.current = {
            fromDate: moment(dates.startDate),
            toDate: moment(dates.endDate),
            rangeName: range
        };
        
        this.refreshUrl();
    }
    
    onRelationSelect() {
        this.$rootScope.$broadcast('rootCause.relation.selected', this.metrics.selected);
        
        this.refreshUrl();
    }
    
    refreshUrl() {
        this.$state.go('.', this.getJson(), {notify: false});
    }

    calculate() {
        if(this.form.$invalid) return;

        this.loading = true;
        this.isError = false;

        this.AppEventsService.track('root-cause-calculate');
        
        this.RootCauseService.getImpacts(this.getJson()).then(impacts => {
            this.impacts = this.ImpactFactory.create(impacts);
            this.topReasons = impacts.top_reasons.map(item => ({
                dimension: item.dimension,
                value: item.value,
                isIncrease: this.impacts.goal.isIncrease,
                isGood: item.goal_diff > 0 && this.impacts.goal.isIncrease || item.goal_diff <= 0 && !this.impacts.goal.isIncrease,
                difference: this.$filter('value')(item.goal_diff.toFixed(2), {symbol: this.impacts.goal.symbol}, false),
                shortDifference: this.$filter('value')(item.goal_diff.toFixed(2), {symbol: this.impacts.goal.symbol}, true),
                variance: this.$filter('value')(item.percentage_explained * 100, {symbol: '%'}, false),
            }));
    
            this.$rootScope.$broadcast('rootCause.calculate.finished', {
                relation: this.getJson().relationId,
                impacts: impacts
            });
        }).catch((error) => {
            console.log(error);
            this.isError = true;
        }).finally(() => {
            this.loading = false;
        });
    }
    
    getJson() {
        return {
            relationId: this.metrics.selected && this.metrics.selected.id,
            previous: {
                fromDate: +this.previous.fromDate,
                toDate: +this.previous.toDate,
                rangeName: this.previous.rangeName
            },
            current: {
                fromDate: +this.current.fromDate,
                toDate: +this.current.toDate,
                rangeName: this.current.rangeName
            },
            filters: this.filters,
            dimensions: !this.dimension.manualMode ? [] : this.dimension.items.filter(item => item.selected).map(item => {
                return {
                    columnId: item.columnId,
                    tableId: item.tableId,
                    name: item.name,
                };
            })
        };
    }

    getCurrentDateString() {
        return `${this.current.fromDate.format('MMMM Do, YYYY')} - ${this.current.toDate.format('MMMM Do, YYYY')}`;
    }

    getPreviousDateString() {
        return `${this.previous.fromDate.format('MMMM Do, YYYY')} - ${this.previous.toDate.format('MMMM Do, YYYY')}`;
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

truedashApp.component('appRootCause', {
    controller: RootCauseCtrl,
    templateUrl: 'content/rootCause/rootCause.html'
});
