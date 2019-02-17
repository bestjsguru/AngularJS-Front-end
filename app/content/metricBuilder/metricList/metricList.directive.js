'use strict';

import Tabs from '../../common/tabs';

class MetricListController {
    constructor(MetricService, toaster, $scope, DeregisterService, $filter, $confirm, $state, $rootScope, $q) {
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$state = $state;
        this.$filter = $filter;
        this.$confirm = $confirm;
        this.$q = $q;
        this.MetricService = MetricService;
        this.MetricCollection = MetricService.createCollection();
        this.toaster = toaster;
        this.sources = [];
        this.metrics = [];
        this.allMetrics = [];
        this.selectedMetric = {};
        this.filterMetrics = '';
        this.selected = false;
        this.loaded = false;
        this.tabs = new Tabs(['metrics', 'personal']);
        this.watchers = DeregisterService.create(this.$scope);

        this.tabs.activate('metrics');

        // Get current metric to load
        this.currentMetricId = $state.params.metricId;

        this.init().then(() => this.filter());

        this.watchers.on('metricBuilder.metricCreated', (event, metric) => this.addNewMetric(metric));
    }

    filter() {
        this.saveCollapsedState();
    
        this.metrics = this.$filter('customSearch')(this.allMetrics, 'name,label,description,source,type', this.filterMetrics);

        this.sources = this.MetricCollection.getMetricsGroupedBySource(this.metrics);
        this.filterMetrics.length && this.sources.forEach(source => source.collapsed = false);
        this.applyCollapsedState();
        this.openSelectedSource();
    }

    init(useCache = true) {
        this.loaded = false;

        let promises = [this.MetricService.getAll(false, useCache), this.MetricService.getAllCohorts(useCache)];

        return this.$q.all(promises).then(([metrics, cohorts]) => {
            this.loaded = true;
            this.metrics = this.allMetrics = [...metrics, ...cohorts];

            this.metrics = this.MetricCollection.sortMetricsBySource(this.allMetrics);

            // Get current metric
            let currentMetric = this.metrics.find(item => item.id == this.currentMetricId);

            // Preselect current metric
            if(currentMetric) {
                this.setSelectedMetric(currentMetric);
            } else if(this.currentMetricId) {
                this.clearSelected();
                this.metricBuilder.closeForm();
                this.$state.go('.', {metricId: null});
            }

            this.sources = this.MetricCollection.getMetricsGroupedBySource(this.metrics);
        });
    }
    
    openSelectedSource() {
        this.sources = this.sources.map(source => {
            if(this.isActiveSource(source)) source.collapsed = false;
            
            return source;
        });
    }

    refreshMetricList() {
        return this.init(false).then(() => this.filter());
    }

    saveCollapsedState() {
        if(this.filterMetrics.length && !this.collapsedState) {
            this.collapsedState = _.clone(this.sources);
        }
    }

    applyCollapsedState() {
        if(!this.filterMetrics.length && this.collapsedState) {
            this.sources.map(source => {
                this.collapsedState.forEach(state => {
                    if(source.name == state.name) source.collapsed = state.collapsed;
                });
            });

            this.collapsedState = null;
        }
    }

    sort(direction) {
        var sortDirection = direction == 'asc' ? 1 : -1;
        this.sources.sort((a, b) => {
            return a.name.localeCompare(b.name) * sortDirection;
        });
    }

    delete(metric) {
        this.$confirm({text: 'Are you sure you want to delete this metric? This action cannot be undone.'}).then(() => {
            return this.MetricService.delete(metric).then(() => {
                this.toaster.success('Metric deleted');
                this.$state.go('.', {metricId: null});
            }).catch(error => this.toaster.error(error.message));
        });
    }

    setSelectedMetric(metric) {
        if(this.currentMetricId !== metric.id) {
            // Change the route without reloading the controller again
            this.$state.go('.', {metricId: metric.id}, {notify: false});

            if (this.metricBuilder.metricData && this.metricBuilder.metricData.submitted) {
                this.metricBuilder.metricData.submitted = false;
            }
        }

        this.selected = true;
        this.selectedMetric = metric;
        this.currentMetricId = metric.id;
        this.$rootScope.$emit('metric.metricSelected', {metricId: this.currentMetricId});
    }

    isActiveMetric(metric) {
        return this.selectedMetric.id === metric.id;
    }

    isActiveSource(source) {
        if(!this.selectedMetric.id){
            return false;
        }

        let isNormal = this.selectedMetric.source == source.name;
        let isVirtualSql = this.selectedMetric.isSQLBased() && source.isCustom;
        let isVirtualNoSource = !this.selectedMetric.source && source.hasNoSource && !this.selectedMetric.isSQLBased();

        return isNormal || isVirtualSql || isVirtualNoSource;
    }

    showMyMetrics() {
        this.filterMetrics = '';
        this.tabs.activate('personal');
        this.metrics = this.allMetrics.filter((metric) => {
            return metric.isOwnedByCurrentUser();
        });
        this.sources = this.MetricCollection.getMetricsGroupedBySource(this.metrics);
    }

    showAllMetrics() {
        this.filterMetrics = '';
        this.tabs.activate('metrics');
        this.metrics = this.allMetrics.filter((metric) => true);
        this.sources = this.MetricCollection.getMetricsGroupedBySource(this.metrics);
    }

    addNewMetric(metric) {
        this.allMetrics.unshift(metric);
        this.metrics = this.allMetrics;
        this.sources = this.MetricCollection.getMetricsGroupedBySource(this.metrics);
    }

    clearSelected() {
        this.selected = false;
        this.selectedMetric = {};
        this.currentMetricId = false;
    }
}

truedashApp.directive('tuMetricList', ($interval) => {
    return {
        controller: MetricListController,
        restrict: 'E',
        templateUrl: 'content/metricBuilder/metricList/metricList.html',
        bindToController: true,
        controllerAs: 'ml',
        require: '^tuMetricBuilder',
        link: function(scope, element, attrs, requires) {
            scope.ml.metricBuilder = requires;
            scope.ml.metricBuilder.metricList = scope.ml;

            angular.extend(scope, {

                getItemCls: function(id){
                    return `metric_list-${id}`;
                },

                toggle: function(source) {
                    source.collapsed = !source.collapsed;
                },

                isCollapsed: function(source) {
                    return source.collapsed;
                }
            });

            scope.$watch('[ml.currentMetricId, ml.loaded]', (response) => {
                if(response[1] && response[0]){
                   var promise = $interval(() => {
                       var currentItem = element.find('.active-metric');

                       if(currentItem.length){
                           element.find('.available-metrics').scrollTop(currentItem.position().top);
                           $interval.cancel(promise);
                           promise = null;
                       }
                   }, 80, 10);
                }
            });
        }
    };
});
