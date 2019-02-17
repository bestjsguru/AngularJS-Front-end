'use strict';

import {Config} from '../../config';
import {Helpers} from '../../common/helpers';

const frequencyMap = {
    hourly: {single: 'hour', plural: 'hours'},
    daily: {single: 'day', plural: 'days'},
    weekly: {single: 'week', plural: 'weeks'},
    monthly: {single: 'month', plural: 'months'},
    yearly: {single: 'year', plural: 'years'}
};

export class EmailReportSentenceGenerator {
    constructor(dashboard, card, data) {
        this.data = _.clone(data);
        this.card = _.clone(card);
        this.dashboard = _.clone(dashboard);
        this.dateFormat = Config.dateFormats.full;
        this.dataFrequency = _.isObject(this.data.alertFrequency) ? this.data.alertFrequency.value : this.data.alertFrequency;
    }

    get(inline = false) {
        let date = moment(this.data.dateTime);

        if(!date.isValid()) return;
        
        let cardName = this.card ? `${this.card.name} / ` : '';
        let dashboardName = `${this.dashboard.name} / `;

        let commPart = `<strong>${dashboardName}${cardName}${this.data.reportType.toUpperCase()}</strong> will be sent`;
        let itemCount = this.isCustomFrequency() ? this.data.customInterval : 0;
        let countPart = itemCount > 1 ? Helpers.ordinalSuffixOf(itemCount) : '';

        if(this.isNowFrequency()) return `${commPart} <strong>Now</strong>`;

        return `${commPart} <strong class="text-capitalize">Every ${countPart} ${EmailReportSentenceGenerator.shortName(this.getFrequencyValue())}</strong>
                ${inline ? '' : '<br>' }
                Starting from <strong>${date.format(this.dateFormat)}</strong>`;
    }

    isCustomFrequency() {
        return this.dataFrequency == 'CUSTOM' || this.data.customInterval > 1;
    }

    isNowFrequency() {
        return this.dataFrequency == 'NOW';
    }

    getFrequencyValue() {
        return this.dataFrequency == 'CUSTOM' ? this.data.customAlertFrequency.value : this.dataFrequency;
    }

    static shortName(frequency, count = 1) {
        if(!frequency) return;

        return frequencyMap[frequency.toLowerCase()][(count > 1 ? 'plural' : 'single')];
    }

}
