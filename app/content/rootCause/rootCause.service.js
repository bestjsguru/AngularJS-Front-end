import FakeData100 from './fakeData/100';
import FakeData1000 from './fakeData/1000';
import FakeData2000 from './fakeData/2000';
import FakeData3000 from './fakeData/3000';

class RootCauseService {
    constructor(DataProvider, $q, $window) {
        this.$q = $q;
        this.$window = $window;
        this.DataProvider = DataProvider;
        
        this.fakeData = {
            100: FakeData100,
            1000: FakeData1000,
            2000: FakeData2000,
            3000: FakeData3000,
        };
    }

    getAvailableMetrics() {

        if(!this.$window.isDemo) {
            return this.DataProvider.get('rootCause/availableMetrics', {}, false);
        }

        return this.$q.when(true).then(() => {
            return [
                {
                    id: 1000,
                    name: "Sales (Marketing Funnel)"
                }, {
                    id: 2000,
                    name: "Sales"
                }, {
                    id: 3000,
                    name: "Gross Sales"
                }, {
                    id: 99990,
                    name: "Yearly sales (Error)"
                }
            ];
        });
    }

    getImpacts(params) {
        
        // TODO Rename relationId to relationshipId on all places to comply with BE naming
        params.relationshipId = params.relationId;
        delete params.relationId;
        
        // Add organisation id and Auth token so python box can use APIs
        params.organisationId = window.Auth.user.organisation.id;
        params.token = window.Auth.user.token.value;
        
        if(!this.$window.isDemo) {
            return this.DataProvider.post('rootCause/calculate', params, false);
        }
        
        return this.$q.when(this.randomDelay()).then(() => {
            if (params.relationshipId === 99990) {
                return this.$q.reject('There is an error in data');
            }

            return this.$window.isDemo ? this.fakeData[params.relationshipId] : this.fakeData[100];
        });
    }

    getAvailableDimensions(relationId) {
        return this.DataProvider.get('rootCause/availableDimensions/' + relationId);
    }

    randomDelay() {
        let times = [400, 500, 600, 300, 700];
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, times[Math.floor(Math.random() * times.length)]);
        });
    }
}

truedashApp.service('RootCauseService', RootCauseService);
