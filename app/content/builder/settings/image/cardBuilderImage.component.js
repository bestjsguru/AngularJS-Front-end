'use strict';

import './validImageUrl.directive';

class CardBuilderImageCtrl {
    constructor() {
        this.card = undefined;

        this.url = '';

        this.horizontal = {
            items: ['left', 'center', 'right']
        };

        this.vertical = {
            items: ['top', 'center', 'bottom']
        };

        this.displayType = {
            items: ['none', 'stretch', 'fit', 'tile']
        };

        this.opacity = {
            items: [
                {value: 0, label: '0%'},
                {value: 10, label: '10%'},
                {value: 20, label: '20%'},
                {value: 30, label: '30%'},
                {value: 40, label: '40%'},
                {value: 50, label: '50%'},
                {value: 60, label: '60%'},
                {value: 70, label: '70%'},
                {value: 80, label: '80%'},
                {value: 90, label: '90%'},
                {value: 100, label: '100%'},
            ]
        };
    }

    $onInit() {
        this.card = this.cardBuilder.card;
    
        this.opacity.selected = this.opacity.items.find(item => item.value === this.card.image.opacity);
    }

    onOpacitySelect(item) {
        this.card.image.opacity = item.value;
    }
}

truedashApp.component('appCardBuilderImage', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: CardBuilderImageCtrl,
    templateUrl: 'content/builder/settings/image/cardBuilderImage.html'
});
