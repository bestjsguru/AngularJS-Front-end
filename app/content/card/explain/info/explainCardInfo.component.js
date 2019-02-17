'use strict';

import ConvertFormula from '../../../builder/formulas/convertFormula';
import ConvertFilter from '../../../builder/filters/convertFilter';
import ConvertGrouping from '../../../builder/groupings/convertGrouping';

class ExplainCardInfoCtrl {
    constructor() {
        this.convertFormula = new ConvertFormula();
        this.convertFilter = new ConvertFilter();
        this.convertGrouping = new ConvertGrouping();
    }

    $onInit() {
        if(this.card.metrics.loaded) this.loadLetters();

        this.card.metrics.on('loaded', () => this.loadLetters(), this);
    }

    loadLetters() {
        this.letters = this.card.formulas.getLetters();
    }

    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }
}

truedashApp.component('appExplainCardInfo', {
    controller: ExplainCardInfoCtrl,
    templateUrl: 'content/card/explain/info/explainCardInfo.html',
    bindings: {
        card: '='
    }
});
