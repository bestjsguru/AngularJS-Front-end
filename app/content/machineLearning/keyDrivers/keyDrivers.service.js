import FakeData100 from './fakeData/100';

class KeyDriversService {
    constructor(DataProvider, $q, $window) {
        this.$q = $q;
        this.$window = $window;
        this.DataProvider = DataProvider;
    }

    getImpacts(params) {
        // Add organisation id and Auth token so python box can use APIs
        params.organisationId = window.Auth.user.organisation.id;
        params.token = window.Auth.user.token.value;
        
        return this.DataProvider.fake().post('keyDrivers/calculate', params, false).then(() => {
            return FakeData100;
        });
    }

    getAvailableDimensions(actualMetricId) {
        // This is a hack to return available dimensions for a single metric
        let forecastMetricId = actualMetricId;
        
        return this.DataProvider.get('forecastAnalysis/availableDimensions', {actualMetricId, forecastMetricId});
    }
}

truedashApp.service('KeyDriversService', KeyDriversService);
