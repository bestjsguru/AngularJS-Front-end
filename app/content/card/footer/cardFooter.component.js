'use strict';

class CardFooterController {
    constructor($q, $state, $element) {

        this.$q = $q;
        this.$state = $state;
        this.$element = $element;

        if (window.Location.isPhantom) {
            this.$element.hide();

            return;
        }
    }
    
    isOnDashboard() {
        return !!this.tuDashboard;
    }
}

truedashApp.component('appCardFooter', {
    controller: CardFooterController,
    templateUrl: 'content/card/footer/cardFooter.html',
    bindings: {
        card: '=',
    },
    require: {
        tuCard: '^?tuCard',
        tuDashboard: '^?tuDashboard',
    }
});
