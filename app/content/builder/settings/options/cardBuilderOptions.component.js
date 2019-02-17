'use strict';

import "../../totals/cardBuilderTotals.component";
import "../../../timezonePicker/timezonePicker.component";

class CardBuilderOptionsCtrl {
    constructor($scope, DeregisterService) {
        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        this.card = this.cardBuilder.card;
        this.size = this.card.size;
    
        this.watchers.watch('$ctrl.size', this.onSizeChange.bind(this));
        this.watchers.watch('$ctrl.card.timezone', () => this.card.metrics.loadData());
    }

    tableTotalsAreVisible() {
        // We do not show table totals for table and numeric card types
        return this.card.metrics.length > 0 && !['table'].includes(this.card.types.get());
    }

    onSizeChange(size) {
        if(size === this.card.size) return;
        
        this.card.setSize(size);
        this.card.metrics.loadData();
    }
    
    onNoSortClick() {
        this.card.noSort = !this.card.noSort;
        this.card.metrics.loadData();
    }
    
    onUseTimezoneClick() {
        this.card.useTimezone = !this.card.useTimezone;
        this.card.metrics.loadData();
    }
    
    timezoneSentence() {
        let sentence = [
            `* This card is using the user profile's specified timezone <strong>${window.Auth.user.timezoneString()}</strong>.`
        ];
        
        if(this.card.dashboard.timezoneString()) {
            sentence[0] = `* This card is using the dashboard's specified timezone <strong>${this.card.dashboard.timezoneString()}</strong>.`;
            sentence[1] = 'This overrides timezone set at the <strong>user profile</strong> level.';
        }
        
        if(this.card.timezoneString()) {
            sentence[0] = `* This card's timezone is set to <strong>${this.card.timezoneString()}</strong>.`;
            sentence[1] = 'This overrides any timezones set at the <strong>dashboard</strong> and <strong>user profile</strong> levels.';
        }
        
        return sentence.join(' ');
    }
}

truedashApp.component('appCardBuilderOptions', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: CardBuilderOptionsCtrl,
    templateUrl: 'content/builder/settings/options/cardBuilderOptions.html'
});
