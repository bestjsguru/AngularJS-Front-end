'use strict';

class RootCauseDimensionsCtrl {

    constructor(RootCauseService, DeregisterService, $scope) {
        this.RootCauseService = RootCauseService;
        this.watchers = DeregisterService.create($scope);

        this.loading = false;
        this.relation = null;
        this.search = '';
        this.calculatedData = {};
    }
    
    resetDimension() {
        this.dimension = {manualMode: false, items: []};
    }

    $onInit() {
        this.watchers.onRoot('rootCause.relation.selected', (event, relation) => {
            this.relation = relation;
            this.resetDimension();
            this.search = '';
            if(!this.relation || !this.dimension.manualMode) return;

            this.loadRelationDimensions();
        });

        this.watchers.onRoot('rootCause.calculate.finished', (event, data) => {
            // Save list of available dimensions from calculate end point to use later.
            this.calculatedData[data.relation] = data.impacts;
            this.setAvailableDimensions(data.impacts.availableDimensions);
        });
    }

    loadRelationDimensions() {
        this.loading = true;
        
        // Check if we have previously saved data and load that instead of default.
        if(this.calculatedData[this.relation.id]) {
            this.setAvailableDimensions(this.calculatedData[this.relation.id].availableDimensions);
            this.loading = false;
        } else {
            this.RootCauseService.getAvailableDimensions(this.relation.id).then(dimensions => {
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

        if(this.relation && this.dimension.manualMode) this.loadRelationDimensions();
    }

    get searchPlaceholder() {
        if(this.loading) return 'Loading Dimensions...';

        if(!this.relation) return 'Select relation first';

        return 'Search Dimensions';
    }

    get dimensionLimitMessage() {
        return this.dimension.items.filter(item => item.selected).length + '/5 dimensions selected';
    }

    get dimensionLimitIsReached() {
        return this.dimension.items.filter(item => item.selected).length >= 5;
    }

    showLimitMessage() {
        return this.dimension.items.filter(item => item.selected).length > 0 && !this.loading && this.relation;
    }

    selectDimension(dimension) {
        if(!this.dimensionLimitIsReached || dimension.selected) dimension.selected = !dimension.selected;
    }
}

truedashApp.component('appRootCauseDimensions', {
    controller: RootCauseDimensionsCtrl,
    templateUrl: 'content/rootCause/dimensions/rootCauseDimensions.html',
    bindings: {
        dimension: '='
    }
});
