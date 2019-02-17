'use strict';

class KeyDriversDimensionsCtrl {

    constructor(KeyDriversService, DeregisterService, $scope) {
        this.KeyDriversService = KeyDriversService;
        this.watchers = DeregisterService.create($scope);

        this.loading = false;
        this.actualMetric = null;
        this.search = '';
        this.calculatedData = {};
    }
    
    resetDimension() {
        this.dimension = {manualMode: this.dimension.manualMode || false, items: []};
    }

    $onInit() {
        this.watchers.onRoot('keyDrivers.metric.selected', (event, {actual}) => {
            this.actualMetric = actual;
            this.resetDimension();
            this.search = '';
            if(!this.actualMetric || !this.dimension.manualMode) return;

            this.loadMetricDimensions();
        });

        this.watchers.onRoot('keyDrivers.calculate.finished', (event, data) => {
            // Save list of available dimensions from calculate end point to use later.
            this.calculatedData[data.actualMetric] = data.impacts;
            this.setAvailableDimensions(data.impacts.availableDimensions);
        });
    }

    loadMetricDimensions() {
        this.loading = true;
        
        // Check if we have previously saved data and load that instead of default.
        if(this.calculatedData[this.actualMetric.id]) {
            this.setAvailableDimensions(this.calculatedData[this.actualMetric.id].availableDimensions);
            this.loading = false;
        } else {
            this.KeyDriversService.getAvailableDimensions(this.actualMetric.id).then(dimensions => {
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

        if(this.actualMetric && this.dimension.manualMode) this.loadMetricDimensions();
    }

    get searchPlaceholder() {
        if(this.loading) return 'Loading Dimensions...';

        if(!this.actualMetric) return 'Select metric first';

        return 'Search Dimensions';
    }

    get dimensionLimitMessage() {
        return this.dimension.items.filter(item => item.selected).length + '/5 dimensions selected';
    }

    get dimensionLimitIsReached() {
        return this.dimension.items.filter(item => item.selected).length >= 5;
    }

    showLimitMessage() {
        return this.dimension.items.filter(item => item.selected).length > 0 && !this.loading && this.actualMetric;
    }

    selectDimension(dimension) {
        if(!this.dimensionLimitIsReached || dimension.selected) dimension.selected = !dimension.selected;
    }
}

truedashApp.component('appKeyDriversDimensions', {
    controller: KeyDriversDimensionsCtrl,
    templateUrl: 'content/machineLearning/keyDrivers/dimensions/keyDriversDimensions.html',
    bindings: {
        dimension: '='
    }
});
