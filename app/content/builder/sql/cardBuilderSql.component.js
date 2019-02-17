'use strict';

import CodemirrorConfig from '../../common/codemirror/codemirrorConfig';

class CardBuilderSqlController {
    constructor() {
        this.codemirrorConfig = new CodemirrorConfig();
        this.codemirrorConfig.config.readOnly = true;
    }

    $onInit() {
        this.card = this.cardBuilder.card;
        this.card.metrics.on('removed', this.onMetricRemoved, this);
    }

    onMetricRemoved() {
        if(!this.card.metrics.length) this.card.showSql = false;
    }

    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }
}

truedashApp.component('appCardBuilderSql', {
    controller: CardBuilderSqlController,
    templateUrl: 'content/builder/sql/cardBuilderSql.html',
    require: {
        cardBuilder: '^appBuilder'
    }
});
