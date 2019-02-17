'use strict';

class TimezonePickerModalController {
    constructor() {
        this.query = '';
    }

    $onInit() {
        this.timezone = this.resolve.timezone;
        
        this.selected = this.resolve.selected;
        
        this.allTimezones = _.sortBy(_.map(moment.tz.names(), function(zoneName) {
            return {
                name: zoneName,
                offset: zoneName === 'UTC' ? '' : 'UTC' + moment().tz(zoneName).format('Z')
            };
        }), 'offset');
        
        this.timezones = this.allTimezones.filter(item => item);
    }
    
    select(item) {
        this.selected = item;
    }
    
    apply() {
        this.modalInstance.close({
            timezone: this.selected.name
        });
    }
    
    isSelected(item) {
        return this.selected.name === item.name;
    }
    
    filter() {
        this.timezones = this.allTimezones.filter((item) => {
            let nameAndOffset = item.name + ' ' + item.offset;
            
            return nameAndOffset.toLowerCase().includes(this.query.toLowerCase());
        });
    }
}

truedashApp.component('appTimezonePickerModal', {
    controller: TimezonePickerModalController,
    templateUrl: 'content/timezonePicker/modal/timezonePickerModal.html',
    bindings: {
        modalInstance: "<",
        resolve: '<',
    }
});
