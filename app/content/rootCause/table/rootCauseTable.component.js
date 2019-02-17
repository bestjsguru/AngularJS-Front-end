'use strict';

import {Helpers} from '../../common/helpers';

class RootCauseTableCtrl {
    constructor($rootScope) {
        this.$rootScope = $rootScope;

        this.letterIndex = 0;
    }

    $onInit() {
        this.impacts.items = this.impacts.items.map(item => {
            if(!item.goal) item.letter = this.getLetter();

            return item;
        });
    }

    getLetter() {
        return Helpers.alphabet[this.letterIndex++];
    }

    drillDown(item) {
        this.$rootScope.$broadcast('rootCauseWaterfall.point.click', item);
    }
    
    getImpactClass(impact) {
        return {
            'text-success': impact.impactIsGood,
            'text-danger': !impact.impactIsGood,
        };
    }
    
    getImpactPercentClass(impact) {
        return {
            'fa-arrow-up': impact.isIncrease,
            'fa-arrow-down': !impact.isIncrease,
            'text-success': impact.impactIsGood,
            'text-danger': !impact.impactIsGood,
        };
    }
}

truedashApp.component('appRootCauseTable', {
    controller: RootCauseTableCtrl,
    templateUrl: 'content/rootCause/table/rootCauseTable.html',
    bindings: {
        impacts: '='
    }
});
