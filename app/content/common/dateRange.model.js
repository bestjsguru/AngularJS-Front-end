'use strict';

import {RangeModel} from './models/range.model';
import {DATE_RANGE_CUSTOM_VALUE} from '../config.js';

export class DateRangeModel {
    constructor({ranges, range, startDate = null, endDate = null, sunWeek = false, fiscalYearStart = false}, DataRangeService) {
        this.ranges = ranges;
        this.startDate = DateRangeModel._parseDate(startDate);
        this.endDate = DateRangeModel._parseDate(endDate);
        this.fiscalYearStart = fiscalYearStart;
        this.label = '';
        this.sunWeek = sunWeek;
        this.numbers = new RangeModel();

        this.setRange(range);

        /** @type {DataRangeService} **/
        this.DataRangeService = DataRangeService;
    }

    getRangeLabel() {
        return this.DataRangeService.getLabel(this.range, this.range.numbers);
    }

    initFields() {
        this.label = this.range.label;
        this.name = this.range.value;
    }

    setRange(userRange, dates) {
        this.range = userRange;
        this.initFields();
        this.calculateDateRange();
    }

    /**
     * @param {RangeModel} range
     */
    setNumbers(range){
        this.range.numbers = range;
        
        return this;
    }

    getRange() {
        return this.range;
    }

    getDates() {
        return {startDate: this.startDate, endDate: this.endDate};
    }

    /**
     * calculates from and to parameters depending on current range and provided from-to range
     * @returns {{from: *, to: *}}
     */
    getFromTo() {

        var from, to;
        var diff;

        switch (this.range.value) {
        /*************************************************
         *      CURRENT
         *************************************************/
            case 'today':
                from = moment().startOf('day');
                to = moment().endOf('day');
                break;
            case 'week':
                diff = this.sunWeek ? 1 : 0;
                from = moment().add(diff, 'd').startOf('isoWeek').subtract(diff, 'd');
                to = moment().add(diff, 'd').endOf('isoWeek').subtract(diff, 'd');
                break;
            case 'month':
                from = moment().startOf('month');
                to = moment().endOf('month');
                break;
            case 'quarter':
                from = moment().startOf('quarter');
                to = moment().endOf('quarter');
                break;
            case 'year':
                from = moment().startOf('year');
                to = moment().endOf('year');
                break;
    
        /*************************************************
         *      TO FULL MONTH
         *************************************************/
            case 'yearToFullMonth':
                from = moment().startOf('year');
                to = moment().subtract(1, 'month').endOf('month');
        
                // If from is equal to start of this month we have to take previous year time period
                if(from.isSame(moment().startOf('month'))) {
                    from = from.subtract(1, 'year');
                }
                break;

        /*************************************************
         *      TO DATE
         *************************************************/
            case 'weekTY':
                diff = this.sunWeek ? 1 : 0;
                from = moment().add(diff, 'd').startOf('isoWeek').subtract(diff, 'd');
                to = moment().endOf('day').subtract(1, 'day');

                // If from is equal to today we have to take previous time period
                if(from.isSame(moment().startOf('day'))) {
                    from = from.subtract(1, 'week')
                }
                break;
            case 'monthTY':
                from = moment().startOf('month');
                to = moment().endOf('day').subtract(1, 'day');

                // If from is equal to today we have to take previous time period
                if(from.isSame(moment().startOf('day'))) {
                    from = from.subtract(1, 'month')
                }
                break;
            case 'quarterTY':
                from = moment().startOf('quarter');
                to = moment().endOf('day').subtract(1, 'day');

                // If from is equal to today we have to take previous time period
                if(from.isSame(moment().startOf('day'))) {
                    from = from.subtract(1, 'quarter')
                }
                break;
            case 'yearTY':
                from = moment().startOf('year');
                to = moment().endOf('day').subtract(1, 'day');

                // If from is equal to today we have to take previous time period
                if(from.isSame(moment().startOf('day'))) {
                    from = from.subtract(1, 'year')
                }
                break;
            case 'fiscalYearTY':
                ({from, to} = this.calculateFiscalYear());
                to = moment().endOf('day').subtract(1, 'day');
                break;

        /*************************************************
         *      PREVIOUS
         *************************************************/
            case 'yesterday':
                from = moment().startOf('day').subtract(1, 'day');
                to = moment().endOf('day').subtract(1, 'day');
                break;
            case 'prevWeek':
                diff = this.sunWeek ? 1 : 0;
                from = moment().add(diff, 'd').startOf('isoWeek').subtract(diff + 7, 'd');
                to = moment().add(diff, 'd').endOf('isoWeek').subtract(diff + 7, 'd');
                break;
            case 'prevMonth':
                from = moment().subtract(1, 'month').startOf('month');
                to = moment().subtract(1, 'month').endOf('month');
                break;
            case 'prevQuarter':
                from = moment().startOf('quarter').subtract(1, 'quarter');
                to = moment().endOf('quarter').subtract(1, 'quarter');
                break;
            case 'prev6Months':
                from = moment().subtract(6, 'month').startOf('month');
                to = moment().subtract(1, 'month').endOf('month');
                break;
            case 'prevYearByExactDate':
            case 'prevYearByWeekDate':
            case 'lastYear':
                from = moment().startOf('year').subtract(1, 'year');
                to = moment().endOf('year').subtract(1, 'year');
                break;
            case 'quarterLastYear':
                from = moment().startOf('quarter').subtract(1, 'year');
                to = moment().endOf('quarter').subtract(1, 'year');
                break;
                
        /*************************************************
         *      PREVIOUS
         *************************************************/
            case 'tomorrow':
                from = moment().startOf('day').add(1, 'day');
                to = moment().endOf('day').add(1, 'day');
                break;
            case 'nextWeek':
                diff = this.sunWeek ? 1 : 0;
                from = moment().add(diff + 7, 'd').startOf('isoWeek').subtract(diff, 'd');
                to = moment().add(diff + 7, 'd').endOf('isoWeek').subtract(diff, 'd');
                break;
            case 'nextMonth':
                from = moment().add(1, 'month').startOf('month');
                to = moment().add(1, 'month').endOf('month');
                break;
            case 'nextQuarter':
                from = moment().startOf('quarter').add(1, 'quarter');
                to = moment().endOf('quarter').add(1, 'quarter');
                break;
            case 'nextYear':
                from = moment().startOf('year').add(1, 'year');
                to = moment().endOf('year').add(1, 'year');
                break;

        /*************************************************
         *      ROLLING
         *************************************************/
            case 'last7Days':
                from = moment().startOf('day').subtract(7, 'days');
                to = moment().endOf('day').subtract(1, 'day');
                break;
            case 'last30Days':
                from = moment().startOf('day').subtract(30, 'days');
                to = moment().endOf('day').subtract(1, 'day');
                break;
            case 'last4Weeks':
                diff = this.sunWeek ? 1 : 0;
                from = moment().add(diff, 'd').startOf('isoWeek').subtract(diff + 28, 'd');
                to = moment().add(diff, 'd').endOf('isoWeek').subtract(diff + 7, 'd');
                break;
            case 'last3Months':
                from = moment().startOf('day').subtract(3, 'months');
                to = moment().endOf('day').subtract(1, 'day');
                break;
            case 'last6Months':
                from = moment().startOf('day').subtract(6, 'months');
                to = moment().endOf('day').subtract(1, 'day');
                break;
            case 'last12Months':
                from = moment().startOf('day').subtract(12, 'months');
                to = moment().endOf('day').subtract(1, 'day');
                break;
            case DATE_RANGE_CUSTOM_VALUE:
                from = moment().startOf('day').subtract(this.range.numbers.from, 'days');
                to = moment().endOf('day').subtract(this.range.numbers.to, 'days');
                break;

        /*************************************************
         *      OTHER
         *************************************************/
            case 'custom':
            case 'customWeek':
                from = moment(this.startDate).startOf('day');
                to = moment(this.endDate).endOf('day');
                break;
            case 'allTime':
                from = moment().startOf('year').subtract(25, 'years');
                to = moment().endOf('year').add(20, 'years');
                break;
            case 'fiscalYear':
                ({from, to} = this.calculateFiscalYear());
                break;
            case 'prevFiscalYear':
                ({from, to} = this.calculateFiscalYear());
                from = from.subtract(1, 'years');
                to = to.subtract(1, 'years');
                break;
        }
    
        return {from, to};
    }

    calculateDateRange() {
        var {from, to} = this.getFromTo();

        this.startDate = from;
        this.endDate = to;
    }

    setStartEnd(start, end) {
        this.startDate = start;
        this.endDate = end;
    }

    calculateFiscalYear() {
        var from, to;
        if (moment().get('month') >= this.fiscalYearStart) {
            from = moment().startOf('year').add(this.fiscalYearStart, 'months');
            to = moment().startOf('year').add(this.fiscalYearStart, 'months').add(1, 'years').subtract(1, 'days');
        } else {
            from = moment().startOf('year').subtract(1, 'years').add(this.fiscalYearStart, 'months');
            to = moment().startOf('year').add(this.fiscalYearStart, 'months').subtract(1, 'days');
        }
        return {from, to};
    }

    validate(){
        return this.startDate.isValid() && this.endDate.isValid();
    }

    static _parseDate(date){
        return date ? moment(date) : moment();
    }
}
