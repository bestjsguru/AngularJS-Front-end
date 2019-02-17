'use strict';

import '../modal/forecastAnalysisFilterModal.component';

class ForecastAnalysisFilterButtonController {
    constructor($uibModal, $scope, DeregisterService) {
        this.$uibModal = $uibModal;
    
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.filters = [];
        this.actualMetric = null;
        this.forecastMetric = null;
    
        this.watchers.onRoot('forecastAnalysis.filters.changed', (event, filters) => {
            this.filters = filters;
        });
    
        this.watchers.onRoot('forecastAnalysis.metric.selected', (event, {actual, forecast}) => {
            this.actualMetric = actual;
            this.forecastMetric = forecast;
        });
    }
    
    openModal() {
        this.$uibModal.open({
            size: 'lg',
            component: 'appForecastAnalysisFilterModal',
            resolve: {
                forecastAnalysis: () => this.forecastAnalysis,
            }
        });
    }
}

truedashApp.component('appForecastAnalysisFilterButton', {
    controller: ForecastAnalysisFilterButtonController,
    templateUrl: 'content/machineLearning/forecastAnalysis/filters/button/forecastAnalysisFilterButton.html',
    bindings: {
        forecastAnalysis: '=',
    }
});
