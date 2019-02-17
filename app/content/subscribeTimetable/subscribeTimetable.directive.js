'use strict';

import {Config} from '../config';
import {FrequencySentenceGenerator} from '../common/frequencySentenceGenerator.js';

class SubscribeTimetableController {
    constructor() {
        this.convertFrequencyToSentenceString = FrequencySentenceGenerator.convertFrequencyToSentenceString;
    }

    $onInit() {
        if (this.subscribeData.customInterval && this.subscribeData.customInterval > 1) {
            this.showCustom = true;
            this.subscribeData.alertFrequency = this.subscribeData.frequencies[this.subscribeData.frequencies.length - 1];
        }
        this.selected = this.subscribeData;

    }

    getFrequencySentence() {
        return new FrequencySentenceGenerator(this.selected, Config.dateFormats.full).get();
    }

    updateFrequency(freq) {
        this.showCustom = freq.value == 'CUSTOM';
    }
}

truedashApp.component('tuSubscribeTimetable', {
    controller: SubscribeTimetableController,
    templateUrl: 'content/subscribeTimetable/subscribeTimetable.html',
    bindings: {
        subscribeData: '='
    }
});
