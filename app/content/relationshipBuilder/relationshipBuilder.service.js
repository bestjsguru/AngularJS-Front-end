class RelationshipBuilderService {
    constructor(DataProvider, $q) {
        this.$q = $q;
        this.DataProvider = DataProvider;
    }

    getMetricData(item, relation) {
        let params = {
            previous: relation.getJson().previous,
            current: relation.getJson().current
        };

        item.loading = true;

        return this.DataProvider.get('relationship/metricData/' + item.metric_id, params, true).then((response) => {
            if(response.metric_values) {
                return {
                    symbol: response.metric_values[0].symbol,
                    previous: parseFloat(response.metric_values[0].control),
                    current: parseFloat(response.metric_values[0].test),
                    difference: parseFloat(response.metric_values[0].difference),
                    percent: parseFloat(response.metric_values[0].difference * 100 / response.metric_values[0].control),
                };
            }
        }).finally(() => item.loading = false);
    }

    all(useCache = true) {
        return this.DataProvider.get('relationship/all', {}, useCache);
    }

    update(relation) {
        return this.DataProvider.post('relationship/update', relation.getJson());
    }

    create(relation) {
        return this.DataProvider.post('relationship/create', relation.getJson());
    }

    remove(relation) {
        return this.DataProvider.get('relationship/delete/' + relation.id);
    }

    calculate(relation) {
        let numbers = [4000, 5000, 6000, 13000, 17000];
        return this.randomDelay().then(() => {
            return relation.drivers.reduce((data, driver) => {
                data.push({
                    id: driver.metric.id,
                    contribution: numbers[Math.floor(Math.random() * numbers.length)]
                });

                return data;
            }, []);
        });
    }

    randomDelay() {
        let times = [400, 500, 600, 300, 700];
        return this.$q((resolve) => {
            return setTimeout(() => {
                resolve();
            }, times[Math.floor(Math.random() * times.length)]);
        });
    }
}

truedashApp.service('RelationshipBuilderService', RelationshipBuilderService);
