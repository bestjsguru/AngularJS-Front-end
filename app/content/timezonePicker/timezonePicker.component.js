'use strict';

import './modal/timezonePickerModal.component';
import {Config} from '../config';

class TimezonePickerController {
    constructor($uibModal, DeregisterService, $scope) {
        this.$uibModal = $uibModal;
        this.watchers = DeregisterService.create($scope);
        
        this.defaultTimezones = [
            Config.timezone,
            'Europe/London',
            'Europe/Berlin',
            'Asia/Hong_Kong',
            'America/New_York',
            'Australia/Sydney',
        ];
    }

    $onInit() {
        this.init();
    }
    
    init() {
        this.timezones = [];
        
        this.selected = {
            name: this.timezone,
            offset: this.timezone === 'UTC' ? '' : 'UTC' + moment().tz(this.timezone).format('Z')
        };
    
        let timezones = _.uniq([...this.defaultTimezones, this.timezone]);
    
        this.timezones = _.sortBy(_.map(timezones, (zoneName) => {
            return {
                name: zoneName,
                offset: zoneName === 'UTC' ? '' : 'UTC' + moment().tz(zoneName).format('Z')
            };
        }), 'offset');
    }
    
    select(item) {
        this.selected = item;
        this.timezone = this.selected.name;
    }
    
    isSelected(item) {
        return this.selected.name === item.name;
    }
    
    showMore() {
        this.$uibModal.open({
            size: 'md',
            component: 'appTimezonePickerModal',
            bindToController: true,
            resolve: {
                selected: () => this.selected,
                timezone: () => this.timezone,
            }
        }).result.then((response) => {
            this.timezone = response.timezone;
            this.init();
        });
    }
}

truedashApp.component('appTimezonePicker', {
    controller: TimezonePickerController,
    templateUrl: 'content/timezonePicker/timezonePicker.html',
    bindings: {
        timezone: '=',
        isDisabled: '=?'
    }
});
