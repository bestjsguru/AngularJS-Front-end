'use strict';

import {Automation} from './automation.model';
import {AutomationCollection} from './automation.collection';

class AutomationService {

    constructor($q, DataProvider) {
        /** @type {$q} **/
        this.$q = $q;

        /** @type {DataProvider} **/
        this.DataProvider = DataProvider;
        this.AutomationCollection = new AutomationCollection();
    }

    create(data) {
        return new Automation(data);
    }

    load() {
        var promise = this.DataProvider.get('automation/all', {}, false);

        // var promise = this.$q.when(this.getRandomAutomation(15));

        return promise.then((response) => {
            this.AutomationCollection.clear();

            if(!response.length) return;

            response.forEach((item) => this.AutomationCollection.add(this.create(item)));

            return this.AutomationCollection.items;
        });
    }

    add(automation) {

        var promise = this.DataProvider.post('automation/create', automation.getJson(), false);

        // var promise = this.$q.when(true);

        return promise.then((response) => {

            if(response.automation) this.AutomationCollection.add(this.create(response.automation));

            return automation;

        });
    }

    update(automation) {

        var promise = this.DataProvider.put('automation/update', automation.getJson(), false);

        // var promise = this.$q.when(true);

        return promise.then(() => {

            this.AutomationCollection.update(automation);

            return automation;

        });
    }

    remove(automation) {

        var promise = this.DataProvider.delete('automation/delete/' + automation.id, {}, false);

        // var promise = this.$q.when(true);

        return promise.then(() => {
            this.AutomationCollection.remove(automation);
            return this.AutomationCollection.items;
        });
    }

    getRandomAutomation(amount = 5) {
        var items = [];

        while(amount > 0) {
            items.push({
                id: amount,
                name: 'Automation ' + amount,
                protocol: 'FTP',
                lastRunTime: moment().subtract(amount, 'days').valueOf(),
                nextRunTime: moment().add(amount, 'days').valueOf(),
                errors: [],
                active: [true, false][Math.floor(Math.random() * [true, false].length)],
                alertFrequency: {
                    value: ['MONTHLY', 'WEEKLY', 'DAILY', 'MONTHLY'][Math.floor(Math.random() * ['MONTHLY', 'WEEKLY', 'DAILY', 'MONTHLY'].length)]
                },
                customInterval: [1, 1, 1, 4, 5][Math.floor(Math.random() * [1, 1, 1, 4, 5].length)],
                dateTime: moment().subtract(amount, 'weeks').valueOf(),
                card: {
                    id: 6975
                }
            });

            amount --;
        }

        return items;
    }

}

truedashApp.service('AutomationService', AutomationService);
