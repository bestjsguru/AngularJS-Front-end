'use strict';

import './drill/drillCard.component';

class ExpandCardCtrl {
    constructor(AppEventsService) {
        this.AppEventsService = AppEventsService;
    }

    $onInit() {
        this.card = this.resolve.card;
    
        this.AppEventsService.track('used-expand-mode');
    }

    collapse() {
        this.dismiss();
    }
}

truedashApp.component('appExpandCard', {
    controller: ExpandCardCtrl,
    templateUrl: 'content/card/expand/expandCard.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
