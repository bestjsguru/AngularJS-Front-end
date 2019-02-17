'use strict';

class MetricBuilderController {
    
    constructor($uibModal, $scope, $state, DeregisterService, CloneManagerService, $rootScope, AppEventsService) {
        this.$rootScope = $rootScope;
        this.modal = null;
        this.$uibModal = $uibModal;
        this.$scope = $scope;
        this.$state = $state;
        this.formVisible = false;
    
        AppEventsService.track('used-metric-builder');

        this.watchers = DeregisterService.create($scope);
        this.watchers.watch('m.metricList.selectedMetric', selectedMetric => {
            if(selectedMetric.id) this.formVisible = true;
        });

        this.$scope.$on('metric.clone', (event, metric, data) => {
            CloneManagerService
                .clone(metric, data)
                .then((metric) => {
                    this.$state.go('.', {metricId: metric.id});
                });
        });
    }

    openForm() {
        // Change the route without reloading the controller again
        this.$state.go('.', {metricId: null}, {notify: false});

        this.metricList.clearSelected();
        this.metricPreview.show('details');
        this.formVisible = true;

        if (this.metricData && this.metricData.submitted) {
            this.metricData.submitted = false;
        }
        this.$rootScope.$emit('metric.metricSelected');
    }

    closeForm() {
        this.formVisible = false;
    }
}

truedashApp.directive('tuMetricBuilder', () => {
    return {
        controller: MetricBuilderController,
        templateUrl: 'content/metricBuilder/metricBuilder.html',
        restrict: 'E',
        bindToController: true,
        controllerAs: 'm'
    };
});
