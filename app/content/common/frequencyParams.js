'use strict';

export class FrequencyParams {
    static getFrequencies() {
        return [
            {value: 'DAILY', label: 'Every Day', verb: "Daily"},
            {value: 'WEEKLY', label: 'Every Week', verb: "Weekly"},
            {value: 'MONTHLY', label: 'Every Month', verb: "Monthly"},
            {value: 'HOURLY', label: 'Every Hour', verb: "Hourly"}
        ];
    }

    static getFrequency(value) {
        return this.getFrequencies().find(frequency => frequency.value === value);
    }

    static getCustomFrequencies() {
        return [
            {value: 'CUSTOM', label: 'Custom option', verb: "Custom"}
        ];
    }

    static getCustomFrequency() {
        return this.getCustomFrequencies().find(frequency => frequency.value === 'CUSTOM');
    }

    static getAllFrequencies() {
        return this.getFrequencies().concat(this.getCustomFrequencies());
    }
}
