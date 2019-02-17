'use strict';

import './singleAnomaly/singleAnomaly.component';
import './cardAnomalies';

class AnomalyDetectionController {

    /**
     *
     * @param {AnomalyDetectionService} AnomalyDetectionService
     * @param {toaster} toaster
     * @param {CardFactory} CardFactory
     * @param {DeregisterService} DeregisterService
     */
    constructor(AnomalyDetectionService, $rootScope, toaster, CardFactory, $scope, $state,
                DeregisterService, $uibModal, $window, CardAnomaliesFactory) {
        this.$state = $state;
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.$uibModal = $uibModal;
        this.$window = $window;
        this.CardFactory = CardFactory;
        this.AnomalyDetectionService = AnomalyDetectionService;
        this.watchers = DeregisterService.create($scope);
        this.CardAnomaliesFactory = CardAnomaliesFactory;

        this.form = {};
        this.filters = {};
        this.pagination = {};

        this.levels = [
            {label: 'Low', value: 'low'},
            {label: 'Medium', value: 'medium'},
            {label: 'High', value: 'high'}
        ];
        this.frequencies = [
            {label: 'Hourly', value: 'hourly'},
            {label: 'Daily', value: 'daily'},
            {label: 'Weekly', value: 'weekly'}
        ];
        this.isAnomaly = [
            {label: 'True', value: true},
            {label: 'False', value: false}
        ];
        this.isGood = [
            {label: 'Good', value: true},
            {label: 'Bad', value: false}
        ];
        this.showNoData = [
            {label: 'Show All Cards', value: true},
            {label: 'Show Anomalies Only', value: false}
        ];
    }

    gridsterItemOptions(index) {
        if(this.layout === 'list') return this.gridsterListPosition(index);
        if(this.layout === '2columns') return this.gridster2ColumnsPosition(index);
        if(this.layout === '3columns') return this.gridster3ColumnsPosition(index);
    }

    gridsterListPosition(index) {
        return {sizeX: 8, sizeY: 3, row: index+1, col: 0};
    }

    gridster2ColumnsPosition(index) {
        let isFirstInRow = (index + 1) % 2;

        return {sizeX: 4, sizeY: 3, row: Math.floor((index+1)/2), col: isFirstInRow ? 0 : 4};
    }

    gridster3ColumnsPosition(index) {
        let isFirstInRow = (index + 1) % 3 === 1;
        let isLastInRow = (index + 1) % 3 === 0;

        return {
            sizeX: isFirstInRow || isLastInRow ? 3 : 2,
            sizeY: 3,
            row: Math.ceil((index+1)/3),
            col: isFirstInRow ? 0 : (isLastInRow ? 5 : 3)
        };
    }

    $onInit() {
        this.preselect();

        this.filter();

        this.watchers.onRoot('highchart.point.click', (e, point) => {
    
            point = _.clone(point);
    
            if(point.anomaly && point.anomaly.isAnomaly) {
                this.cards.some(card => {
                    card.anomalies.has(point.anomaly) && this.$uibModal.open({
                        size: 'md',
                        component: 'appSingleAnomaly',
                        resolve: {
                            anomaly: () => point.anomaly,
                            card: () => card,
                        }
                    });
                });
            }
        });

        this.watchers.watch('$ctrl.layout', () => {
            // Trigger window resize in order to fit charts to new card sizes
            angular.element(this.$window).trigger('resize');
            this.setUrlParams();
        });
    }

    getAnomalies(page = this.pagination.currentPage, size = this.pagination.perPage, filters = this.filters) {
        this.cards = [];
        this.loading = true;

        this.setUrlParams();

        return this.AnomalyDetectionService.getOrganisationAnomalies(page, size, filters).then(response => {
            if (angular.isArray(response.metrics)) {
                response.metrics.forEach((anomaly, index) => {
                    this.cards.push(this.createCardFromAnomaly(anomaly, index));
                });

                this.pagination.total = response.total;

                this.cards.sort((a, b) => a.metrics.get(0).id - b.metrics.get(0).id);
            } else {
                this.toaster.warning('There are no anomalies.');
            }
        }).catch(() => {
            this.toaster.error('Anomalies could not be loaded.');
        }).finally(() => {
            this.loading = false;
        });
    }

    preselect() {
        this.layout = ['list', '2columns', '3columns'].find(item => item === this.$state.params.layout) || '2columns';
        this.pagination.currentPage = +this.$state.params.page || 1;
        this.pagination.perPage = +this.$state.params.size || 10;
        this.form.metric = this.$state.params.metric || '';
        this.form.alertLevel = this.levels.find(item => item.label.toLowerCase() === this.$state.params.alertLevel);
        this.form.frequency = this.frequencies.find(item => item.label.toLowerCase() === this.$state.params.frequency);
        this.form.isAnomaly = this.isAnomaly.find(item => item.label.toLowerCase() === this.$state.params.isAnomaly);
        this.form.isGood = this.isGood.find(item => item.label.toLowerCase() === this.$state.params.isGood);
        this.form.showNoData = this.showNoData.find(item => item.label.toLowerCase() === this.$state.params.showNoData) || this.showNoData[1];
    }

    setUrlParams() {
        let params = {
            layout: this.layout,
            page: this.pagination.currentPage,
            size: this.pagination.perPage,
            metric: this.form.metric || null,
            alertLevel: this.form.alertLevel ? this.form.alertLevel.label.toLowerCase() : null,
            frequency: this.form.frequency ? this.form.frequency.label.toLowerCase() : null,
            isAnomaly: this.form.isAnomaly ? this.form.isAnomaly.label.toLowerCase() : null,
            isGood: this.form.isGood ? this.form.isGood.label.toLowerCase() : null,
            showNoData: this.form.showNoData ? this.form.showNoData.label.toLowerCase() : null
        };

        this.$state.go('.', params, {notify: false});
    }

    createCardFromAnomaly(response, index) {
        let anomalies = response.anomalies || [];
        let card = this.CardFactory.create();
        let data = anomalies.map(anomaly => [anomaly.data, anomaly.value]);
        data.sort((a, b) => a[0] - b[0]);
        card.metrics.add(response.metric, data);

        // Check for anomaly errors
        if(response.isError) {
            card.metrics.setError('loadData', true, response.error);
        }

        let rangeMetric = angular.copy(response.metric);
        rangeMetric.name = 'Range';
        rangeMetric.type = 'arearange';

        let rangeMetricData = anomalies.map(anomaly => [anomaly.data, anomaly.lowerBound, anomaly.upperBound]);
        rangeMetricData.sort((a, b) => a[0] - b[0]);
        card.metrics.add(rangeMetric, rangeMetricData);

        // We set unique card id to be able to use it in events that are fired for card exporting / download
        card.id = index + 1;
        card.types.type = 'line';
        card.types.subType = 'arearange';
        card.frequencies.selected = 'Hourly';
        card.fillChart = true;
        card.anomalies = this.CardAnomaliesFactory.create(anomalies, response.metric);
        card.anomalies.readAll();
        
        return card;
    }

    download(cardId, type, title) {
        this.$rootScope.$emit('card.download.' + cardId, {type, title});
    }

    filter() {
        this.filters = {};

        this.form.metric ? this.filters.metric = this.form.metric : delete this.filters.metric;
        this.form.frequency ? this.filters.frequency = this.form.frequency.value : delete this.filters.frequency;
        this.form.alertLevel ? this.filters.alertLevel = this.form.alertLevel.value : delete this.filters.alertLevel;
        this.form.isAnomaly ? this.filters.isAnomaly = this.form.isAnomaly.value : delete this.filters.isAnomaly;
        this.form.isGood ? this.filters.isGood = this.form.isGood.value : delete this.filters.isGood;
        this.form.showNoData ? this.filters.showNoData = this.form.showNoData.value : delete this.filters.showNoData;

        // Always return to first page when filters are applied
        this.pagination.currentPage = 1;

        return this.getAnomalies();
    }

    reset() {
        this.form = {};

        return this.filter();
    }
}

truedashApp.component('tuAnomalyDetection', {
    controller: AnomalyDetectionController,
    templateUrl: 'content/anomalyDetection/anomalyDetection.html'
});
