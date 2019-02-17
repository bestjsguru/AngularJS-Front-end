'use strict';

import {Helpers} from '../helpers';

class TimepickerCtrl {
    $onInit() {
        this.hours = this.hours || moment().format('HH');
        this.minutes = this.minutes || moment().format('mm');
    }
    
    updateHours() {
        this.hours = Helpers.pad(parseInt(Math.abs(this.hours) % 24), 2);
        
        if(isNaN(this.hours)) this.hours = '00';
    }
    
    updateMinutes() {
        this.minutes = Helpers.pad(parseInt(Math.abs(this.minutes) % 60), 2);
    
        if(isNaN(this.minutes)) this.minutes = '00';
    }
    
    incrementHours() {
        this.hours = parseInt(this.hours) + 1;
        this.updateHours();
    }
    
    incrementMinutes() {
        if(parseInt(this.minutes) === 59) this.incrementHours();
        
        this.minutes = parseInt(this.minutes) + 1;
        this.updateMinutes();
    }
    
    decrementHours() {
        this.hours = parseInt(this.hours) === 0 ? 23 : parseInt(this.hours) - 1;
        this.updateHours();
    }
    
    decrementMinutes() {
        if(parseInt(this.minutes) === 0) this.decrementHours();
        
        this.minutes = parseInt(this.minutes) === 0 ? 59 : parseInt(this.minutes) - 1;
        this.updateMinutes();
    }
}

truedashApp.component('appTimepicker', {
    controller: TimepickerCtrl,
    templateUrl: 'content/common/timepicker/timepicker.html',
    bindings: {
        hours: '=',
        minutes: '='
    }
});
