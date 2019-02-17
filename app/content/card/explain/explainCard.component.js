'use strict';

import './info/explainCardInfo.component';
import './definition/explainCardDefinition.component';
import './sql/explainCardSql.component';

class ExplainCardCtrl {
    constructor() {
        this.tab = 'info';
    }

    $onInit() {
        this.card = this.resolve.card;
    }

}

truedashApp.component('appExplainCard', {
    controller: ExplainCardCtrl,
    templateUrl: 'content/card/explain/explainCard.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
