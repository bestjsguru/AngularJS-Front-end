'use strict';

import '../../anomalyDetection/singleAnomaly/singleAnomaly.component';
import '../../anomalyDetection/cardAnomalies';
import '../metricFavourites/metricFavourites.component';

class MetricAlertsCtrl {
    constructor($state, $element, DeregisterService, $scope, CardFactory, toaster, $uibModal,
                Auth, $rootScope, SmartAlertsService, CardAnomaliesFactory, $filter) {
        this.$state = $state;
        this.$scope = $scope;
        this.$element = $element;
        this.CardFactory = CardFactory;
        this.SmartAlertsService = SmartAlertsService;
        this.toaster = toaster;
        this.watchers = DeregisterService.create($scope);
        this.$uibModal = $uibModal;
        this.user = Auth.user;
        this.$rootScope = $rootScope;
        this.CardAnomaliesFactory = CardAnomaliesFactory;
        this.$filter = $filter;
        
        this.alert = {
            id: this.$state.params.metricId,
        };
        
        this.metric = {
            id: this.$state.params.metricId,
        };
        
        if(!this.metric.id) {
            this.$state.go('home');
        }
    
        this.blank = [];
        this.sendTo = [this.user];
        this.alertVia = [
            {label: 'Email', value: 'Email'},
            {label: 'Web app', value: 'Web app'},
            {label: 'Mobile app', value: 'Mobile app'}
        ];
        this.notifications = [
            {label: '1', value: '1'},
            {label: '2', value: '2'},
            {label: '3', value: '3'},
            {label: '4', value: '4'},
            {label: '5', value: '5'},
            {label: '6', value: '6'},
            {label: '7', value: '7'},
            {label: 'Never', value: 'Never'},
        ];
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
    }
    
    $onInit() {
        
        this.getAnomalies();
        this.preselect();
        
        this.watchers.onRoot('highchart.point.click', (e, point) => {
            point = _.clone(point);
            if(point.anomaly && point.anomaly.isAnomaly) {
                this.showAnomalyPopup(point.anomaly);
            }
        });
    
        this.watchers.onRoot('highchart.point.mouseover', (e, point) => {
            this.$scope.$apply(() => {
                this.highlightedAnomaly = {};
                if(point.anomaly && point.anomaly.isAnomaly) {
                    this.highlightedAnomaly = point.anomaly;
                    
                    let element = this.$element.find('.metric-table tr:nth-child(' + (this.card.anomalies.getIndex(point.anomaly) + 1) + ')');
                    this.$element.find('.metric-table')[0].scrollTop = element[0].offsetTop - 100;
                }
                
            });
        });
    
        this.watchers.onRoot('highchart.mouseout', () => {
            this.$scope.$apply(() => {
                this.highlightedAnomaly = {};
            });
        });
    }
    
    save() {
        this.form.enabled = false;
        this.toaster.success('Metric details updated');
    }
    
    preselect() {
        this.form = {
            frequencies: this.frequencies[1],
            levels: this.levels[0],
            sendTo: this.sendTo[0],
            alertVia: this.alertVia[0],
            notifications: this.notifications[4],
        };
    }
    
    toggleTrendline() {
        this.card.showMetricTrend = !this.card.showMetricTrend;
    }
    
    showChartTooltip(anomaly) {
        this.highlightedAnomaly = anomaly;
    
        let index = this.card.metrics.get(0).getData().findIndex(item => item[0] === anomaly.data);
        
        return this.$rootScope.$broadcast('highchart.showTooltip', {index});
    }
    
    hideChartTooltip() {
        this.highlightedAnomaly = {};
        this.$rootScope.$broadcast('highchart.hideTooltip');
    }
    
    showAnomalyPopup(anomaly) {
        this.$uibModal.open({
            size: 'md',
            component: 'appSingleAnomaly',
            resolve: {
                anomaly: () => anomaly,
                card: () => this.card,
            }
        });
    }
    
    getAnomalies() {
        this.loading = true;
        
        return this.SmartAlertsService.getMetricAnomalies(this.metric.id).then(response => {
            if (response.anomalyDetections && response.anomalyDetections.length) {
                this.card = this.createCardFromAnomaly(response.anomalyDetections[0]);
                this.metric = this.card.metrics.get(0);
                this.orderBy('anomaly.data');
            } else {
                this.toaster.error('Metric not found');
                this.$state.go('home');
            }
        }).catch(() => {
            this.toaster.error(`Alerts couldn't be loaded.`);
        }).finally(() => {
            this.loading = false;
        });
    }
    
    createCardFromAnomaly(response) {
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
        
        this.addTrendlineData(card, response);
    
        // We set unique card id to be able to use it in events that are fired for card exporting / download
        card.id = response.anomalyInfo.id;
        card.name = response.anomalyInfo.name;
        card.description = response.anomalyInfo.description;
        card.types.type = 'line';
        card.types.subType = 'arearange';
        card.frequencies.selected = response.anomalyInfo.frequency || 'hourly';
        card.fillChart = true;
        card.anomalies = this.CardAnomaliesFactory.create(anomalies, response.metric);
        
        return card;
    }
    
    addTrendlineData(card, response) {
        let anomalies = response.anomalies || [];
        let data = anomalies.map(anomaly => [anomaly.data, anomaly.value]);
        data.sort((a, b) => a[0] - b[0]);
        
        let times = [1.1, 1, 1.05, 1.1, 0.9, 0.9, 1, 0.95];
        let average = data.reduce((sum, value) => {
                return sum + value[1];
            }, 0) / data.length;
        let trendlineData = angular.copy(data).map((value) => {
            value[1] = average * times[Math.floor(Math.random() * times.length)];
            return value;
        });
        
        let trendMetric = angular.copy(response.metric);
        trendMetric.name = 'Trend Line';
        trendMetric.type = 'trendline';
        card.metrics.add(trendMetric, trendlineData);
    }
    
    download(type, title) {
        this.$rootScope.$emit('card.download.' + this.card.id, {type, title});
    }
    
    readAllAlerts() {
        this.SmartAlertsService.readAllByMetric(this.metric.id).then(() => {
            this.card.anomalies.readAll();
        });
    }
    
    toggleAlert(anomaly) {
        let action = anomaly.alert.read ? 'unread' : 'read';
        
        this.SmartAlertsService[action](anomaly.alert.id).then(() => {
            this.card.anomalies[action](anomaly);
        });
    }
    
    orderBy(column) {
        this.orderColumn = column;
        this.reverse = !this.reverse;
        this.card.anomalies.items = this.$filter('orderBy')(this.card.anomalies.items, this.orderColumn, this.reverse);
    }
    
    orderedBy(column) {
        return this.orderColumn === column;
    }
    
    hasValidCard() {
        // This means that card has data and is loaded without errors
        return this.card && this.card.hasData() && !this.card.metrics.error;
    }
    
    exit() {
        // If there are any url params we will redirect user back to smart alert page
        // And in case there are no params we can assume that user came from home page
        this.$state.params.layout ? this.$state.go('smartAlerts', this.$state.params) : this.$state.go('home');
    }
}

truedashApp.component('appMetricAlerts', {
    controller: MetricAlertsCtrl,
    templateUrl: 'content/smartAlerts/metricAlerts/metricAlerts.html'
});
