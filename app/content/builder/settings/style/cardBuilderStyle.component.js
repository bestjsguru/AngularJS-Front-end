'use strict';

import '../mixed/mixedSettings.component';
import '../scatter/scatterSettings.component';
import '../bubble/bubbleSettings.component';
import '../sankey/sankeySettings.component';
import '../bullet/bulletSettings.component';
import '../treemap/treemapSettings.component';

class CardBuilderStyleCtrl {
    constructor($q, $confirm) {
        this.$q = $q;
        this.card = undefined;
        this.$confirm = $confirm;
    }

    $onInit() {
        this.card = this.cardBuilder.card;

        this.onTypeUpdated();
        this.card.types.on('updated', this.onTypeUpdated, this);
    }

    changeType(type, subType) {
        this.cardBuilder.updateCardType(type, subType);
    }

    onTypeUpdated() {
        this.currentType = this.card.types.subType;
    }

    $onDestroy() {
        this.card.types.off(null, null, this);
    }
}

truedashApp.component('appCardBuilderStyle', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: CardBuilderStyleCtrl,
    templateUrl: 'content/builder/settings/style/cardBuilderStyle.html'
});
