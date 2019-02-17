'use strict';

import {EventEmitter} from '../../system/events';
import {Config} from '../../config';

export class Automation extends EventEmitter {
    constructor(data) {
        super();

        // Make sure data is at least empty array
        if(data === null || data === undefined) data = [];

        this.init(data);
    }

    init(data) {
        if(data.id) this.id = data.id;

        this.name = data.name || '';
        this.protocol = data.protocol || '';
        this.lastRun = data.lastRunTime ? moment(data.lastRunTime).format(Config.dateFormats.full) : null;
        this.nextRun = data.nextRunTime ? moment(data.nextRunTime).format(Config.dateFormats.full) : null;
        this.errors = data.errors || [];
        this.active = data.active === false ? false : true;
        this.alertFrequency = data.alertFrequency;
        this.customInterval = data.customInterval;
        this.setDateTime(data.dateTime);
        this.setCard(data.card);
    }

    update(data) {
        this.init(_.extend(this, data));
    }

    setCard(card) {
        this.card = card;
    }

    setDateTime(date) {
        this.dateTime = date ? moment(date) : null;
    }

    getJson() {
        var automation = {
            name: this.name,
            protocol: this.protocol,
            active: this.active,
            alertFrequency: this.alertFrequency.value.toUpperCase(),
            customInterval: this.customInterval
        };

        if(this.dateTime) automation.dateTime = this.dateTime.valueOf();
        if(this.card) automation.card = this.card.id;

        // We do not have ID when creating automations so we avoid sending it to server
        if(this.id) automation.id = this.id;

        return automation;
    }
}

truedashApp.value('Automation', Automation);



