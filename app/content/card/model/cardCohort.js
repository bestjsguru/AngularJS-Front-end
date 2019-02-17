'use strict';

import {EventEmitter} from '../../system/events.js';

class CardCohort extends EventEmitter {
    constructor(card) {
        super();
        this.card = card;
    }

    init(data) {
        this.fromDate = data.cohortFromDate;
        this.toDate = data.cohortToDate;
        this.rangeName = data.cohortRangeName;
    }

    updateDates(dates, range) {
        this.rangeName = range;
        this.fromDate = moment(dates.startDate);
        this.toDate = moment(dates.endDate);

        return this.card.metrics.loadData();
    }
}

truedashApp.service('CardCohortFactory', () => ({
    create: (card) => new CardCohort(card)
}));

