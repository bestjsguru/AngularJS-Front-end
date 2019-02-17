'use strict';

import {SmartAlertsCollection} from './smartAlerts.collection';

class SmartAlerts extends SmartAlertsCollection {
    constructor(data, $injector) {
        super($injector);

        this.data = data;
        this.init(data);
    }

    init(smartAlerts) {
        this.clear();
    
        smartAlerts.forEach(item => {
            this.add(item);
        });

        this.sortSmartAlerts();

        return this.items;
    }
}

truedashApp.service('SmartAlertsFactory', ($injector) => ({
    create: (data) => {
        return new SmartAlerts(data, $injector);
    }
}));
