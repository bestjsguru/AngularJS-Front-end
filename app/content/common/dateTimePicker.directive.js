'use strict';

import {Helpers} from './helpers';
import {Config} from '../config.js';

import './timepicker/timepicker.component';

class DateTimePickerCtrl {
    constructor($scope, DeregisterService) {
        this.opened = false;
        this.watchers = DeregisterService.create($scope);

        // Date picker settings
        this.datePickerPopupFormat = Config.dateFormats.regularDatePicker;
        this.dateOptions = {
            formatYear: 'yy',
            isOpen: this.opened,
            startingDay: window.Auth.user.organisation.startDayOfWeek % 7,
        };
    }

    $onInit() {
        if(!this.dateTime) this.dateTime = moment();
    
        // We need to remove time reference so correct date will be used so we format to YYYY-MM-DD
        this.date = new Date(this.dateTime.format('YYYY-MM-DD'));
        this.hours = this.dateTime.format('HH');
        this.minutes = this.dateTime.format('mm');

        this.watchers.watch('dtp.hours', () => this.updated());
        this.watchers.watch('dtp.minutes', () => this.updated());
        
        this.updated();
    }

    updated() {
        // We need to remove time reference so correct date will be used so we format to YYYY-MM-DD
        this.dateTime = moment(Helpers.formatToDateString(this.date));
        this.dateTime.hour(this.hours);
        this.dateTime.minute(this.minutes);
    }

    open($event) {
        $event.preventDefault();
        $event.stopPropagation();
        this.opened = true;
    }
}

truedashApp.directive('tuDateTimePicker', () => ({
    controller: DateTimePickerCtrl,
    templateUrl: 'content/common/dateTimePicker.html',
    restrict: 'E',
    controllerAs: 'dtp',
    bindToController: true,
    scope: {
        dateTime: '='
    }
}));
