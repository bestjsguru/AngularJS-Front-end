'use strict';

import {EventEmitter} from '../system/events';

export class SmartAlertsModel extends EventEmitter {
    constructor(data, $injector) {
        super();

        this.$filter = $injector.get('$filter');

        data = data || {};

        this.originalData = data;
        
        this.id = data.id;
        this.symbol = data.alert.symbol === '\\u00a3' ? '£' : data.alert.symbol;
        this.createdDate = moment(data.createdDate);
        this.read = data.read;
        this.readDate = moment(data.readDate);
        
        this.metric = {
            name: data.alert.objectName,
            id: data.alert.objectId,
        };

        this.alert = {
            id: data.alert.id,
            value: this.formatNumber(data.alert.actualValue),
            shortValue: this.formatNumber(data.alert.actualValue, true),
            date: moment(data.alert.alertDatetimePosition),
            isGood: data.alert.alertGood,
            group: data.alert.alertGroup,
            name: data.alert.alertName,
            isRead: data.alert.alertRead,
            severity: data.alert.alertSeverity,
            timeResolution: data.alert.alertTimeResolution,
            type: data.alert.alertType,
            assignedByUserId: data.alert.assignedByUserId,
            assignedDatetime: data.alert.assignedDatetime,
            assignedToUserId: data.alert.assignedToUserId,
            expectedValue: this.formatNumber(data.alert.expectedValue),
            lowerBound: this.formatNumber(data.alert.lowerBound),
            status: data.alert.status,
            statusLastUpdated: moment(data.alert.statusLastUpdated),
            symbol: data.alert.symbol === '\\u00a3' ? '£' : data.alert.symbol,
            triggeredAt: moment(data.alert.triggeredAt),
            upperBound: this.formatNumber(data.alert.upperBound),
            variance: this.formatPercent(data.alert.variance * 100),
            isIncrease: data.alert.variance > 0,
        };
    }

    formatNumber(number, letters = false) {
        return this.$filter('value')(number, {symbol: this.symbol}, letters);
    }

    formatPercent(number) {
        return this.$filter('value')(number, {symbol: '%'}, false);
    }
}
