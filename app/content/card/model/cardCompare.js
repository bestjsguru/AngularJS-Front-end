'use strict';

import {EventEmitter} from '../../system/events.js';

class CardCompare extends EventEmitter {
    constructor(card, DataProvider, $q, DateRangeService, AppEventsService) {
        super();
        this.card = card;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        /** @type {DateRangeService} **/
        this.DateRangeService = DateRangeService;
        this.$q = $q;
        this.range = null;

        this.card.metrics.on('addMany', () => {
            this.getList()
                .forEach((metric) => {
                    /** @type {MetricModel} **/
                    const sourceMetric = this.getSourceMetric(metric);
                    metric.setYAxisInfo(sourceMetric.getFormattingInfo());
                });
        });
    }

    generateCompareName(compare) {
        if (compare.label) return compare.label;
        return `${compare.metric.name} (${compare.range.label})`;
    }

    addAll(compareJson) {
        this.card.metrics.addCompares(compareJson.map(compare => {
            return {
                fromDate: +compare.range.startDate,
                toDate: +compare.range.endDate,
                range: compare.range,
                color: compare.color,
                hidden: compare.info.hidden,
                comparable: true,
                comparedTo: compare.metric.virtualId,
                rangeName: this.getRangeName(compare.range.name),
                name: this.generateCompareName(compare)
            };
        }));

        this.AppEventsService.track('added-card-compare');

        return this.card.metrics.loadData();
    }

    update(compare, data) {
        compare.setName(data.label);
        compare.color = data.color;
        var range = data.range;
        compare.fromDate = range.startDate.valueOf();
        compare.toDate = range.endDate.valueOf();
        compare.info.rangeName = this.getRangeName(range.name);

        compare.resetColumns();

        this.AppEventsService.track('updated-card-compare');

        return this.card.metrics.loadData();
    }

    remove(compare) {
        this.AppEventsService.track('deleted-card-compare');

        return this.card.metrics.removeMetric(compare);
    }

    getList() {
        return this.card.metrics.filter(metric => metric.isComparable());
    }

    getRange() {
        var comp = this.getList()[0];
        return comp ? this.DateRangeService.createByName(comp.getRangeName(), comp.info.fromDate, comp.info.toDate, this.DateRangeService.getCompareRanges()) : null;
    }

    getReadyForCompareList() {
        return this.card.metrics.filter(metric => {
            if(metric.isComparable()) return false;
            
            return !metric.isFormula() ? true : !this.card.formulas.isCalculatedOnCompares(metric.virtualId);
        });
    }

    show(compare) {
        return this.card.metrics.showMetric(compare);
    }

    hide(compare) {
        return this.card.metrics.hideMetric(compare);
    }

    removeByDataSet(dataset) {
        if (dataset.isComparable()) return;
        this.getList().forEach(compare => {
            if (compare.comparedTo === dataset.virtualId) this.card.metrics.remove(compare);
        });
    }

    // There is a mixup between "Last Year" and "Previous Year" data range
    // Here's how Vitaliy explains it should work:
    // when user select `previousYear` data range on card builder, we need to send `lastYear` in request.
    // when user select `previousYear` date range on `Edit Compare` window we should send `prevYear` in request(like we do), because previous date range calculates depends on card date range.
    //
    // This function was introduced to switch between these two names. The swtich is happening upon create/update metric, and when the range is being displayed in the Edit Compare modal.
    // This code should be removed once the changes have been made to the BE
    getRangeName(rangeName) {
        if (rangeName == 'lastYear')
            return 'prevYear';
        if (rangeName == 'prevYear')
            return 'lastYear';
        return rangeName;
    }

    /**
     * @param {MetricModel} inputMetric
     * @returns {MetricModel}
     */
    getRelatedMetric(inputMetric){
        if(!inputMetric.isComparable()){
            throw new Error('related metrics exist only for comparable-type');
        }

        if(!this.card.isVirtual()){
            let result = this.card.metrics.filter(metric => {
                if(metric == inputMetric){
                    return false;
                }

                if(inputMetric.info.comparedToFormula){
                    //compare to formula
                    return metric.isFormula() && metric.formulaId === inputMetric.comparedTo;
                }

                return !metric.isFormula() && !metric.isComparable() && metric.relationId === inputMetric.comparedTo;
            });

            return result.pop();
        }

        // For virtual card we have to find virtual metric too
        if(inputMetric.rawId !== undefined) {
            let virtualInputMetric = this.card.metrics.find(metric => metric.rawId == inputMetric.rawId);

            if(!virtualInputMetric) return inputMetric;

            inputMetric = virtualInputMetric;
        }

        return this.card.metrics.find(metric => {
            return metric.virtualId === inputMetric.comparedTo;
        });

    }

    /**
     * @todo: replace to better service
     *
     * @param {MetricModel} metric
     * @return {MetricModel}
     */
    getSourceMetric(metric){
        if(metric.isComparable()){
            return this.getRelatedMetric(metric);
        }

        return metric;
    }
}

truedashApp.factory('CardCompareFactory', (DataProvider, $q, DateRangeService, AppEventsService) => ({
    create: (card) => new CardCompare(card, DataProvider, $q, DateRangeService, AppEventsService)
}));
