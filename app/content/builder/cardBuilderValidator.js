'use strict';

export class CardBuilderValidator {
    constructor(card) {
        /** @type {Card} */
        this.card = card;
        this.message = '';
    }

    canSetType(targetType) {
        let msg = null;

        const currentType = this.card.types.type;
        const countMetrics = this.card.metrics.length;
        
        // If there are no metrics there is no need for validation
        if(!countMetrics) return true;

        if(targetType !== 'table' && this.card.isCustomSQL()) {

            msg = 'Cards with complex metrics can only use table type.';
        } else if (targetType === 'numeric' && this.card.groupings.length > 1) {

            msg = 'This card type cannot be displayed as numeric';
        } else if (targetType === 'numeric' && this.card.metrics.isCohort()) {

            msg = 'Cohorts cannot be presented as numerics';
        } else if (targetType === 'map' && this.card.metrics.length && !this.isMap()) {

            msg = 'This card cannot be presented as a map';
        } else if (currentType === 'map' && targetType !== 'table') {

            if (targetType !== 'map') {
                msg = 'Please remove your map metric before switching to another visual type';
            }
        } else if (this.validateCustomDate(this.card)) {

            msg = 'Please enter valid custom date range';
        }

        this.message = msg;

        return !this.message;
    }

    isMap() {
        let data = this.card.metrics.get(0).data;
        if (!data || !data[0] || !data[0][0] || !isNaN(data[0][0])) return false;
        return true;
    }

    /** @private **/
    isPieOrDonut(type){
        return ['pie', 'donut'].indexOf(type) > -1;
    }

    /** @private **/
    hasOneMetricDisplayed() {
        return this.card.metrics.getVisibleMetrics().length === 1 || this.card.metrics.getMetricBasedData().length === 1;
    }

    /** @private **/
    isTotalSelected() {
        return this.card.frequencies.isTotalSelected();
    }

    canAddMetric(metric) {
        let msg = null;

        const currentType = this.card.types.type;
        const isNotTable = !['table'].includes(currentType);

        if (metric.getType() !== 'map' && currentType === 'map') {
            msg = 'This metric cannot be presented on a map';
        } else if (metric.getType() === 'numeric' && currentType !== 'numeric') {
            msg = 'This metric is numeric type only, please switch to numeric visual style';
        } else if (currentType === 'numeric' && metric.isCohort()) {
            msg = 'Cohorts cannot be presented as numeric';
        } else  if (metric.getType() === 'table'  && isNotTable) {
            msg = 'Please switch to table visual style in order to select this metric';
        }

        this.message = msg;

        return !this.message;
    }

    canBeSaved() {
        this.message = null;

        if(!this.card.name) {
            this.message = 'Please enter card name';
        }
        
        if(!this.card.dashboard) {
            this.message = 'Please select dashboard';
        }

        if (this.validateCustomDate(this.card)) {
            this.message = 'Please enter valid custom date range';
        }

        return !this.message;
    }

    validateCustomDate(card) {
        return card.rangeName == 'customDate' && (card.customDateMap.from === null || card.customDateMap.to === null || +card.customDateMap.from < +card.customDateMap.to);

    }
}
