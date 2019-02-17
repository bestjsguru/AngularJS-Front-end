class AnomalyDetectionService {
    constructor(DataProvider, $q) {
        this.$q = $q;
        this.DataProvider = DataProvider;
    }

    getOrganisationAnomalies(page, size, filters) {
        if(!page || !size || !filters) return this.$q.reject('You have to specify page number, size and filters in order to get anomalies');

        return this.DataProvider.post('anomalyDetection/getAnomalies', {page, size, filters}, false);
    }

    getMetricAnomalies(metricId) {
        return this.DataProvider.get('anomalyDetection/getAnomaliesData/' + metricId, {}, false);
    }

}

truedashApp.service('AnomalyDetectionService', AnomalyDetectionService);
