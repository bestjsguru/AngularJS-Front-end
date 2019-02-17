'use strict';

import {Helpers} from './helpers.js';

const frequencyMap = {
    hourly: {single: 'hour', plural: 'hours'},
    daily: {single: 'day', plural: 'days'},
    weekly: {single: 'week', plural: 'weeks'},
    monthly: {single: 'month', plural: 'months'},
    yearly: {single: 'year', plural: 'years'}
};

export class FrequencySentenceGenerator {
    constructor(data, dateFormat) {
        this.data = data;
        this.dateFormat = dateFormat;
        this.dataFrequency = _.isObject(this.data.alertFrequency) ? this.data.alertFrequency.value : this.data.alertFrequency;
    }

    get() {
        var date = moment(this.data.dateTime);

        if(!this.data.alertFrequency || !date.isValid()) return;

        var itemCount = this.isCustomFrequency() ? this.data.customInterval : 0;
        var countPart = itemCount > 1 ? Helpers.ordinalSuffixOf(itemCount) : '';
        let commPart = this.data.sentenceStart ? this.data.sentenceStart.trim() + ' ' : 'Notify me ';

        return commPart + '<strong class="text-capitalize">every ' + countPart + ' '
            + FrequencySentenceGenerator.convertFrequencyToSentenceString(this.getFrequencyValue()) + '</strong>'
            + ', starting from <strong>' + date.format(this.dateFormat) + '</strong>';
    }

    isCustomFrequency() {
        return this.dataFrequency == 'CUSTOM' || this.data.customInterval > 1;
    }

    getFrequencyValue() {
        return this.dataFrequency == 'CUSTOM' ? this.data.customAlertFrequency.value : this.dataFrequency;
    }

    static convertFrequencyToSentenceString(frequency, count = 1) {
        if(!frequency) return;

        return frequencyMap[frequency.toLowerCase()][(count > 1 ? 'plural' : 'single')];
    }

}
