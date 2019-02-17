'use strict';

class ForecastAnalysisDimensionsCtrl {

    constructor(ForecastAnalysisService, DeregisterService, $scope) {
        this.ForecastAnalysisService = ForecastAnalysisService;
        this.watchers = DeregisterService.create($scope);

        this.loading = false;
        this.actualMetric = null;
        this.forecastMetric = null;
        this.search = '';
        this.calculatedData = {};
    }
    
    resetDimension() {
        this.dimension = {manualMode: this.dimension.manualMode || false, items: []};
    }

    $onInit() {
        this.watchers.onRoot('forecastAnalysis.metric.selected', (event, {actual, forecast}) => {
            this.actualMetric = actual;
            this.forecastMetric = forecast;
            this.resetDimension();
            this.search = '';
            if(!this.actualMetric || !this.forecastMetric || !this.dimension.manualMode) return;

            this.loadMetricDimensions();
        });

        this.watchers.onRoot('forecastAnalysis.calculate.finished', (event, data) => {
            // Save list of available dimensions from calculate end point to use later.
            this.calculatedData[[data.actualMetric, data.forecastMetric].join('-')] = data.impacts;
            this.setAvailableDimensions(data.impacts.availableDimensions);
        });
    }

    loadMetricDimensions() {
        this.loading = true;
        
        // Check if we have previously saved data and load that instead of default.
        if(this.calculatedData[[this.actualMetric.id, this.forecastMetric.id].join('-')]) {
            this.setAvailableDimensions(this.calculatedData[[this.actualMetric.id, this.forecastMetric.id].join('-')].availableDimensions);
            this.loading = false;
        } else {
            this.ForecastAnalysisService.getAvailableDimensions(this.actualMetric.id, this.forecastMetric.id).then(dimensions => {
                this.setAvailableDimensions(dimensions);
            }).finally(() => {
                this.loading = false;
            });
        }
    }

    setAvailableDimensions(dimensions) {
        this.dimension.items = [];
        this.search = '';
        if(!dimensions) return;

        this.dimension.items = dimensions.map(dimension => {
            return {
                selected: dimension.select_status,
                name: dimension.dimension_name,
                columnId: dimension.columnId,
                tableId: dimension.tableId,
            };
        });
    }

    setManualMode(isManual) {
        this.dimension.manualMode = isManual;

        this.dimension.items = [];
        this.search = '';

        if(this.actualMetric && this.forecastMetric && this.dimension.manualMode) this.loadMetricDimensions();
    }

    get searchPlaceholder() {
        if(this.loading) return 'Loading Dimensions...';

        if(!this.actualMetric || !this.forecastMetric) return 'Select metrics first';

        return 'Search Dimensions';
    }

    get dimensionLimitMessage() {
        return this.dimension.items.filter(item => item.selected).length + '/5 dimensions selected';
    }

    get dimensionLimitIsReached() {
        return this.dimension.items.filter(item => item.selected).length >= 5;
    }

    showLimitMessage() {
        return this.dimension.items.filter(item => item.selected).length > 0 && !this.loading && this.actualMetric && this.forecastMetric;
    }

    selectDimension(dimension) {
        if(!this.dimensionLimitIsReached || dimension.selected) dimension.selected = !dimension.selected;
    }
}

truedashApp.component('appForecastAnalysisDimensions', {
    controller: ForecastAnalysisDimensionsCtrl,
    templateUrl: 'content/machineLearning/forecastAnalysis/dimensions/forecastAnalysisDimensions.html',
    bindings: {
        dimension: '='
    }
});
