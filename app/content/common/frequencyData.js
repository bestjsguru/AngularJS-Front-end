'use strict';

export class FrequencyData {
    static forEmailReport(data) {
        let res = {
            alertFrequency: data.alertFrequency && data.alertFrequency.value.toUpperCase(),
            alertType: data.alertType && data.alertType.value,
            dateTime: moment(data.dateTime).valueOf(),
            cardMetricRelation: null,
            formula: null
        };

        if (data.metric) {
            if (data.metric.isFormula()) {
                res.formula = data.metric.formulaId;
            } else {
                res.cardMetricRelation = data.metric.relationId;
            }
        }

        let isCustomInterval = res.alertFrequency == 'CUSTOM';
        res.customInterval = isCustomInterval ? data.customInterval : 1;
        res.alertFrequency = res.alertFrequency == 'CUSTOM' ? data.customAlertFrequency.value.toUpperCase() : res.alertFrequency;

        return res;
    }

    // TODO This is just temporary solution as this gatherer thingy needs complete overhaul.
    // Hopefully it will be done as a part of automation task
    static forAutomationBuilder(data) {
        let res = {
            alertFrequency: data.alertFrequency && data.alertFrequency.value.toUpperCase(),
            dateTime: moment(data.dateTime).valueOf()
        };

        let isCustomInterval = res.alertFrequency == 'CUSTOM';
        res.customInterval = isCustomInterval ? data.customInterval : 1;
        res.alertFrequency = res.alertFrequency == 'CUSTOM' ? data.customAlertFrequency : data.alertFrequency;

        return res;
    }
}


