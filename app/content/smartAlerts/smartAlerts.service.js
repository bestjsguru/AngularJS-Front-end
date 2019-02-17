'use strict';

import './smartAlerts.factory';

class SmartAlertsService {
    constructor(DataProvider, $q, SmartAlertsFactory, $rootScope) {
        this.$q = $q;
        this.$rootScope = $rootScope;
        this.DataProvider = DataProvider;
        this.SmartAlertsFactory = SmartAlertsFactory;
    }

    getMetrics(page, size, filters) {
        if (!page || !size || !filters) return this.$q.reject('You have to specify page number, size and filters in order to get metrics');

        return this.DataProvider.post('anomalyDetection/getAnomaliesDisplayInfo', {
            page,
            size,
            filters
        }, false);
    }

    getMetricAnomalies(metricId) {
        return this.DataProvider.get('anomalyDetection/getAnomaliesData/' + metricId, {}, false);
    }
    
    refreshMetricAnomalies(metricId) {
        return this.DataProvider.get('anomalyDetection/refreshAnomaliesData/' + metricId, {}, false).then(response => {
            if(_.get(response, 'n_detected_anomalies', false) !== false) {
                return {
                    newAnomalies: _.get(response, 'n_detected_anomalies'),
                }
            }
            
            return response;
        });
    }

    getUnread() {
        return this.DataProvider.get('smartAlert/unread', {}, false).then((items) => {
            return this.SmartAlertsFactory.create(items);
        });
    }

    readAll() {
        return this.DataProvider.get('smartAlert/markAllRead', {}, false).then(alerts => {
            this.$rootScope.$broadcast('smartAlert.read', alerts);

            return alerts;
        });
    }

    readAllByMetric(metricId) {
        return this.DataProvider.get('smartAlert/markReadByMetric/' + metricId, {}, false).then(alerts => {
            this.$rootScope.$broadcast('smartAlert.read', alerts);

            return alerts;
        });
    }

    read(smartAlertId) {
        return this.DataProvider.get('smartAlert/markRead/' + smartAlertId, {}, false).then(alert => {
            this.$rootScope.$broadcast('smartAlert.read', [alert]);

            return alert;
        });
    }

    unread(smartAlertId) {
        return this.DataProvider.get('smartAlert/markUnread/' + smartAlertId, {}, false).then(alert => {
            this.$rootScope.$broadcast('smartAlert.unread', [alert]);

            return alert;
        });
    }

    favourites(metricId) {
        return this.DataProvider.get('smartAlert/favourite/' + metricId, {}, false);
    }

    favourite(metricId) {
        return this.DataProvider.post('smartAlert/favourite/' + metricId, {}, false);
    }

    unfavourite(metricId) {
        return this.DataProvider.post('smartAlert/unfavourite/' + metricId, {}, false);
    }

    createAlert(alert) {
        return this.DataProvider.post('anomalyDetection/create/', alert, false);
    }

    getAlert(alertId) {
        return this.DataProvider.get(`anomalyDetection/getAnomaly/${alertId}`, {}, false);
    }

    getAllAlerts() {
        return this.DataProvider.get(`anomalyDetection/findAllByUser`, {}, false);
    }

    updateAlert(alert) {
        return this.DataProvider.put(`anomalyDetection/update/${alert.id}`, alert, false);
    }

    deleteAlert(alertId) {
        return this.DataProvider.delete(`anomalyDetection/delete/${alertId}`);
    }

    subscribe(alertId, data) {
        return this.DataProvider.post(`anomalyDetection/subscribe/${alertId}`, data, false);
    }

    unSubscribe(alertId) {
        return this.DataProvider.post(`anomalyDetection/unSubscribe/${alertId}`, {}, false);
    }
}

truedashApp.service('SmartAlertsService', SmartAlertsService);
