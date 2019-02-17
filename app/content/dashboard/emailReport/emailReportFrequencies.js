'use strict';

const frequencies = [
    {value: 'HOURLY', label: 'Every Hour', verb: "Hourly"},
    {value: 'DAILY', label: 'Every Day', verb: "Daily"},
    {value: 'WEEKLY', label: 'Every Week', verb: "Weekly"},
    {value: 'MONTHLY', label: 'Every Month', verb: "Monthly"}
];

const custom = [
    {value: 'CUSTOM', label: 'Custom Option', verb: "Custom"}
];

const now = [
    {value: 'NOW', label: 'Now', verb: "Now"}
];

export class EmailReportFrequencies {
    static all() {
        return [...now, ...frequencies, ...custom];
    }

    static get(value) {
        return this.all().find(frequency => frequency.value === value);
    }

    static custom() {
        return frequencies;
    }
}
