"use strict";

import {Helpers} from "./helpers.js";

class CalendarCtrl {
    constructor($scope, DeregisterService) {
        this.$scope = $scope;
        this.watchers = DeregisterService.create($scope);

        this.options = {
            from: {},
            to: {}
        };
    }

    $onInit() {
        this.double = this.double !== 'false';
        this.range = {};

        // double calendar
        this.watchers.watch('calendar.dateRange', range => {
            if (!range) return;
            
            this.range.from = range.from = new Date(Helpers.formatToDateString(range.from));
            this.range.to = range.to = new Date(Helpers.formatToDateString(range.to));
        });
        
        this.watchers.watch('calendar.startingDay', day => {
            if (!day) return;
    
            this.options.from.startingDay = day % 7;
            this.options.to.startingDay = day % 7;
        });

        this.watchers.watchCollection('calendar.range', range => this.initDateOptions(range));
    }

    initDateOptions(range) {
        if (!range || this.isWeekPickerMode()) return;

        this.options.from.maxDate = range.to;
        this.options.to.minDate = range.from;
    }

    setEl(el) {
        this.$el = el;
        this.showCalendar();
        this.defineWeekPickerWatch();
    }

    defineWeekPickerWatch() {
        if (!this.isWeekPickerMode()) return;
        this.watchers.watch('calendar.range.to', (newToDate) => {
            if (!this.isWeekPickerMode()) return;
            this.watchers.timeout(() => {
                let day = moment.isMoment(newToDate) ? newToDate.format('DD') : Helpers.pad(newToDate.getDate(), 2);
                
                this.$el.find(`button > span:contains('${day}'):not('.text-muted')`).closest('tr').addClass('selected').siblings().removeClass('selected');
            }, 30);
        });
    }

    apply() {
        this.hideCalendar();
    
        // We need to remove time reference so correct date will be used so we format to YYYY-MM-DD
        let fromDateString = Helpers.formatToDateString(this.range.from);
        let toDateString = Helpers.formatToDateString(this.range.to);
        
        if(this.isWeekPickerMode()) {
            this.generateWeekRange();
        } else {
            this.dateRange.from = this.range.from = moment(fromDateString).startOf('day');
            this.dateRange.to = this.range.to = moment(toDateString).endOf('day');
        }

        this.applyFunction({range: this.range});
    }
    
    generateWeekRange() {
        let toDateString = Helpers.formatToDateString(this.range.to);
        
        let selectedDay = moment(toDateString).day();
        let weekStartDay = this.startingDay % 7;
    
        let diff = selectedDay >= weekStartDay ? 0 : (selectedDay + 1);
    
        // This is custom case when week starts on Sunday and we click on Sunday
        if(!selectedDay && !weekStartDay) diff = -1;
    
        this.dateRange.from = this.range.from = moment(toDateString).subtract(diff, 'day').startOf('isoWeek').add(weekStartDay - 1, 'day');
        this.dateRange.to = this.range.to = moment(toDateString).subtract(diff, 'day').endOf('isoWeek').add(weekStartDay - 1, 'day');
    }

    cancel() {
        this.hideCalendar();
    }

    isDouble() {
        return this.double == 'true';
    }

    isCalendarButton(el) {
        var element = $(el);
        return element.children('span').length && element.parent('td').length ||
               element.parent('button').length && element.parent().parent('td').length ||
               element.attr('role') == 'heading' || element.parent().attr('role') == 'heading';
    }

    defineHideEvent() {
        $('body').on('click.hideCalendar', (event) => {
            if (!$(event.target).closest('.calendar-holder').length && !this.isCalendarButton(event.target) && this.$el.closest('.calendar-holder').is(":visible")) {
                this.hideCalendar();
            }
        });
    }

    showCalendar() {
        this.setWeekPickerMode();
        var self = this;
        this.$el.closest('.calendar-holder').show('fast', function () {
            self.defineHideEvent();
            // Remove current day selection as we will select whole week instead of just one day
            self.isWeekPickerMode() && $(this).find('button.active').removeClass('active').removeClass('btn-info').find('span').removeClass('text-info');
        });
    }

    hideCalendar() {
        $('body').off('click.hideCalendar');
        this.$el.closest('.calendar-holder').hide('fast', () => {
            this.$scope.$apply(() => this.closeFunction());
        });
    }

    isWeekPickerMode() {
        return this.weekPickerMode === 'true';
    }

    setWeekPickerMode() {
        if (this.isWeekPickerMode()) {
            this.$el.addClass('week-picker-mode');
        } else {
            this.$el.removeClass('week-picker-mode');
        }
    }

}
truedashApp.directive('tuCalendar', () => {
        return {
            restrict: 'E',
            templateUrl: 'content/common/calendar.html',
            replace: true,
            scope: {
                dateRange: '=',
                startingDay: '=?',
                applyFunction: '&',
                closeFunction: '&',
                double: '@',
                weekPickerMode: '@'
            },
            require:'tuCalendar',
            controller: CalendarCtrl,
            bindToController: true,
            controllerAs: 'calendar',

            link: function(scope, $el, attrs, ctrl) {

                ctrl.setEl($el);
                scope.$on('$destroy', function () {
                    $('body').off('click.hideCalendar');
                });


            }
        };
    });
