import FakeData100 from './fakeData/100';

class ForecastAnalysisService {
    constructor(DataProvider, $q, $window) {
        this.$q = $q;
        this.$window = $window;
        this.DataProvider = DataProvider;
    }

    getImpacts(params) {
        // Add organisation id and Auth token so python box can use APIs
        params.organisationId = window.Auth.user.organisation.id;
        params.token = window.Auth.user.token.value;
        
        return this.DataProvider.post('forecastAnalysis/calculate', params, false);
    }

    getAvailableDimensions(actualMetricId, forecastMetricId) {
        return this.DataProvider.get('forecastAnalysis/availableDimensions', {actualMetricId, forecastMetricId});
    }
}

truedashApp.service('ForecastAnalysisService', ForecastAnalysisService);
