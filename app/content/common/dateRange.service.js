'use strict';

import {DateRangeModel} from './dateRange.model';
import {DATE_RANGE_CUSTOM_VALUE} from '../config.js';
import {Config} from '../config.js';

const DEFAULT_RANGE = 'last12Months';

export class DateRangeService {
    constructor($filter) {
        this.ranges = Config.dateRanges;
        this.$filter = $filter;
    }

    create(range = this.getDefaultRange(), ranges = this.ranges, startDate = null, endDate = null) {
        return new DateRangeModel({
            ranges,
            range,
            startDate,
            endDate,
            sunWeek: window.Auth.user.organisation.sunWeek,
            fiscalYearStart: window.Auth.user.organisation.fiscalYearStart
        }, this);
    }

    createByName(range, startDate, endDate, ranges = this.ranges) {
        range = this.getRangeObjectByName(range, ranges) || this.getRangeObjectByName('custom');
        return this.create(range, ranges, startDate, endDate);
    }
    
    getDateFromName(name, startDate, endDate, numbers) {
        return this.createByName(name, startDate, endDate).setNumbers(numbers).getFromTo();
    }
    
    getRangeObjectByName(name, ranges = this.ranges) {
        let range;
        for(let i = 0; i < ranges.length; i++) {
            for(let j = 0; j < ranges[i].ranges.length; j++) {
                if(ranges[i].ranges[j].value === name) {
                    range = ranges[i].ranges[j];
                    break;
                }
            }
        }

        return range;
    }

    /**
     * @param {{}} range
     * @param {String} range.value
     * @param numbers
     * @returns {*}
     */
    getLabel(range, numbers = {}){
        const rangeName = range.value;

        if (!rangeName) return '';

        const foundRangeObj = this.getRangeObjectByName(rangeName) || {};
        let label = foundRangeObj.label || '';

        if(DateRangeService.isCustomDate(range)){
            const replacingMap = {
                'X': numbers.from,
                'Y': numbers.to
            };

            label = label.replace(/X|Y/g, function(matched) {
                return replacingMap[matched];
            });
        }

        return label;
    }

    getDefaultRange() {
        return this.getRangeObjectByName(DEFAULT_RANGE);
    }

    getRangeGroupByLabel(label) {
        return this.ranges.filter(range => range.label === label)[0];
    }

    getCompareRanges() {
        //todo: add better possible ranges generation
        let prev  = this.getRangeGroupByLabel('Previous');
        let other = this.getRangeGroupByLabel('Other');
        other     = {
            label: other.label,
            ranges: other.ranges.filter(range => range.value === 'custom' || range.value === 'customWeek')
        };

        prev = {
            label: prev.label,
            ranges: prev.ranges.filter(range => range.value !== 'quarterLastYear')
        };

        return [other, prev];
    }

    getRangeLabelFromName(rangeName, numbers = {}) {
        let range = this.getRangeObjectByName(rangeName) || {};

        return this.getLabel(range, numbers);
    }

    getFullRangeLabelObject(rangeName, fromDate, toDate, numbers = {}) {
        let range = {
            label: this.getRangeLabelFromName(rangeName, numbers),
            date: '',
            custom: false,
        };
        
        if (rangeName === 'allTime') return range;
        
        if (['custom', 'customWeek'].includes(rangeName)) {
            range.label = range.label.replaceAll('.', '');
            range.custom = true;
        }
    
        let dates = this.getDateFromName(rangeName, fromDate, toDate, numbers);
        
        range.date = '(' + this.$filter('dateRegular')(dates.from) + ' to ' + this.$filter('dateRegular')(dates.to) + ')';
        
        return range;
    }

    /**
     * cut compare range dates to represent sane range for comparing with current range
     * cut based on human logic
     * if there is no special logic provided, metrics are just aligned by the first data point
     * and compared cropped to have no more than regular metrics datapoints.
     * @param currentRange
     * @param compareRange
     * @returns {{start: *, end: *, crop: boolean}}
     */
    getCompareDates(currentRange, compareRange) {
        let crop = true, res;
        if (currentRange.name === 'year') {
            crop = false;
        }
        if (currentRange.name === 'quarter')
            res = this.getCompareLastYear(currentRange, compareRange);
        if (!res && currentRange.name === 'month')
            res = this.getCompareLastQuarter(currentRange, compareRange);
        if (!res && currentRange.name === 'week')
            res = this.getCompareLastMonth(currentRange, compareRange);
        if (!res && currentRange.name === 'today')
            res = this.getCompareLastMonth(currentRange, compareRange);

        if (!res) res = {
            start: compareRange.startDate,
            end: compareRange.endDate,
            crop: crop
        };

        return res;
    }

    getCompareLastYear(currentRange, compareRange) {
        if (compareRange.name === 'lastYear') {
            return {
                start: moment(currentRange.startDate).subtract(1, 'year'),
                end: moment(currentRange.endDate).subtract(1, 'year'),
                crop: true
            };
        }
        return null;
    }

    getCompareLastQuarter(currentRange, compareRange) {
        let res = this.getCompareLastYear(currentRange, compareRange);
        if (res) return res;
        if (compareRange.name === 'prevQuarter') {
            return {
                start: moment(currentRange.startDate).subtract(3, 'month'),
                end: moment(currentRange.endDate).subtract(3, 'month'),
                crop: true
            };
        }
        return null;
    }

    getCompareLastMonth(currentRange, compareRange) {
        let res = this.getCompareLastQuarter(currentRange, compareRange);
        if (res) return res;
        if (compareRange.name === 'prevMonth') {
            return {
                start: moment(currentRange.startDate).subtract(1, 'month'),
                end: moment(currentRange.endDate).subtract(1, 'month'),
                crop: true
            };
        }
        return null;
    }

    static isCustomDate(range){
        return range.value === DATE_RANGE_CUSTOM_VALUE;
    }

    static notCustomDate(range){
        return range.value !== DATE_RANGE_CUSTOM_VALUE;
    }
}

truedashApp.service('DateRangeService', DateRangeService);
