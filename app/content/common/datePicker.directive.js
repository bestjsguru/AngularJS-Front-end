'use strict';

import {DateRangeService} from './dateRange.service';
import {RangeModel} from './models/range.model';
import {DATE_RANGE_CUSTOM_VALUE} from '../config';

class DatePickerCtrl {
    /**
     *
     * @param {DateRangeService} DateRangeService
     * @param {DateService} DateService
     */
    constructor(DateRangeService, DateService, $q, $timeout) {
        this.DateRangeService = DateRangeService;
        this.$timeout = $timeout;

        this.items = [];
        this.dateRange = {};
        this.currentRangeObject = {};

        this.moving = this.moving ? angular.copy(this.moving) : {from: false, to: false};
        this.delay = +this.delay || 0;

        if (!this.hide) this.hide = [];
        if (!this.show) this.show = [];
        if (!this.currentNumber) this.currentNumber = new RangeModel();
        if (!this.startingDay) this.startingDay = window.Auth.user.organisation.startDayOfWeek;
        
        this.isCalendarShown = false;
        this.showMovingOptions = true;
        this.doubleCalendar = true;
        this.weekPickerMode = false;

        this.isCustomDateFromInputError = false;
        this.isCustomDateToInputError = false;

        $q.when(this.dateRanges || DateService.getDateRanges()).then(ranges => {
            /** @type {DateRangeModel} **/
            this.dateRangeModel = DateRangeService.create(undefined, this.dateRanges);
            this.initRanges(ranges);
            this.initCurrentRange();
        });
    }

    /** @private **/
    initRanges(ranges) {
        this.items = ranges.reduce((items, range) => {
            // Add custom property to determine if range is custom date
            range.ranges.forEach((item, index) => {
                range.ranges[index].custom = item.value.indexOf('custom') >= 0;
            });

            const filteredRanges = _.chain(range.ranges)
                .filter(it => this.hide.indexOf(it.value) == -1) // Remove hidden ranges
                .filter(it => { //show hidden by default items
                    if(!it.hidden) return true;

                    return this.show.indexOf(it.value) !== -1;
                })
                .map(it => {
                    it.numbers = this.currentNumber;
                    return it;
                })
                .value();

            if(filteredRanges.length) {
                // Put header inside ranges list
                items.push({label: range.label, header: true});
                items = items.concat(filteredRanges);
            }

            return items;
        }, []);
    }

    /** @private **/
    initCurrentRange(){
        let range = this.items.find(item => item.value === this.getCurrentRangeName());

        range && this.changeRangeRaw(range, false);
    }

    /**
     * @todo: should be removed make consistent whole app
     * @returns {string}
     * @private
     */
    getCurrentRangeName(){
        return _.isArray(this.currentRange) ? this.currentRange[0] : this.currentRange;
    }

    getRangeLabel(){
        if (this.currentRange === 'today') {
            return 'today';
        }
        return this.dateRangeModel ? this.dateRangeModel.getRangeLabel(this.currentRange) || this.currentRange || this.dateRangeModel.getRange().label : null;
    }

    onCalendarClose() {
        this.isCalendarShown = false;
        
        // On cancel, return selection to previously selected range
        this.initCurrentRange();
    }

    onMovingChange() {
        this.refreshMoving({moving: this.moving});
    }

    changeRange(range) {
        if (range.header) return;

        if (range.value == DATE_RANGE_CUSTOM_VALUE) {

            this.isCustomDateFromInputError = angular.isUndefined(range.numbers.from) || range.numbers.from === null || +range.numbers.from < 0 ||
                +range.numbers.from < +range.numbers.to;

            this.isCustomDateToInputError = angular.isUndefined(range.numbers.to) || range.numbers.to === null || +range.numbers.to < 0 || +range.numbers.from < +range.numbers.to;

            if (this.isCustomDateFromInputError || this.isCustomDateToInputError) {
                return;
            }

        }

        if (this.changeRange.$promise) {
            this.$timeout.cancel(this.changeRange.$promise);
        }

        this.changeRange.$promise = this.$timeout(() => {
            this.changeRangeRaw(range, true);

            if(!this.isCalendarShown) {
                this.refresh({
                    dates: this.dateRangeModel.getDates(),
                    range: this.dateRangeModel.getRange().value
                });
            }

            delete this.changeRange.$promise;
        }, this.delay);
    }

    /** @private **/
    changeRangeRaw(range, showCalendar){
        this.weekPickerMode = false;
        this.doubleCalendar = true;

        this.dateRangeModel.setRange(range);
    
        // Reset custom date numbers
        if(!this.isCustomDate(range) && this.items.find(this.isCustomDate)) {
            this.items.find(this.isCustomDate).numbers.from = 0;
            this.items.find(this.isCustomDate).numbers.to = 0;
        }

        if (range.value == 'custom') {
            this.isCalendarShown = showCalendar;
            return;
        }

        if (range.value == 'customWeek') {
            this.doubleCalendar = false;
            this.weekPickerMode = true;
            this.isCalendarShown = showCalendar;
            return;
        }

        this.isCalendarShown = false;
        this.dateRange = this.dateRangeModel.getFromTo();
    }

    setCustomRange(range) {
        this.dateRangeModel.setStartEnd(range.from, range.to);
        this.refresh({
            dates: this.dateRangeModel.getDates(),
            range: this.dateRangeModel.getRange().value
        });
    }

    setCurrentRange(range) {
        this.currentRangeObject = this.DateRangeService.getRangeObjectByName(range);
    }

    isAvailableCustom() {
        return !!this.items.find(this.isCustomDate);
    }

    isCustomDate(range) {
        return DateRangeService.isCustomDate(range);
    }

    notCustomDate(range) {
        return DateRangeService.notCustomDate(range);
    }
}

truedashApp.directive('tuDatePicker', (DeregisterService) => {
    return {
        restrict: 'E',
        templateUrl: 'content/common/datePicker.html',
        replace: true,
        scope: {
            refresh: '&',
            refreshMoving: '&',
            hide: '=?',
            currentRange: '=',
            currentNumber: '=?',
            dateRanges: '=',
            from:'=',
            to:'=',
            showMoving: '=',
            moving: '=?',
            show: '=?',
            delay: '=?',
            startingDay: '=?',
        },
        bindToController: true,
        controllerAs: 'dp',
        controller: DatePickerCtrl,

        /**
         * @param scope
         * @param el
         * @param attrs
         * @param {DatePickerCtrl} ctrl
         */
        link: function(scope, el, attrs, ctrl) {
            /** @type {DeregisterService} **/
            var watchers = DeregisterService.create(scope);

            // Update moving properties if anything change them from outside
            // Curently we auto-set moving params depending on date range selected
            watchers.watchCollection('dp.moving', (moving) => {
                if(moving) ctrl.moving = moving;
            });

            // Update currentRangeObject whenever date range changes
            watchers.watch('dp.currentRange', range => {
                ctrl.setCurrentRange(range);
            });

            scope.$watch('[from, to]', () => {
                ctrl.dateRange.from = moment(ctrl.from);
                ctrl.dateRange.to = moment(ctrl.to);
            });

            el.on('click', (event) => {
                let element = angular.element(event.target);
                let isSwitchery = element.hasClass('switchery') || element.parents('.switchery').length;

                // We only keep dropdown opened when user is clicking on moving options
                if(isSwitchery) event.stopPropagation();
            });
        }
    };
});
