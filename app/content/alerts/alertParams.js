'use strict';

export class AlertParams {
    static getTypes() {
        return [
            {
                value: 'LESS_THAN_OR_EQUAL_TO', label: 'is less than or equal to',
                display: (frequencyVerb, subject, value) => {
                    return subject + " are less than or equal to " + value;
                }
            },
            {
                value: 'MORE_THAN_OR_EQUAL_TO', label: 'is more than or equal to',
                display: (frequencyVerb, subject, value) => {
                    return subject + " are greater than or equal to " + value;
                }
            },
            {
                value: 'CHANGE_PERCENTAGE', label: 'change in percentage',
                display: (frequencyVerb, subject, value) => {
                    return subject + " to change by " + value + "%";
                },
                isPercentage: true
            }
        ];
    }

    static getType(value) {
        return this.getTypes().find(type => type.value === value);
    }
}
