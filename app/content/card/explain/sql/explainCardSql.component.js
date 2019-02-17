'use strict';

import CodemirrorConfig from '../../../common/codemirror/codemirrorConfig';

class ExplainCardSqlController {
    constructor() {
        this.codemirrorConfig = new CodemirrorConfig();
        this.codemirrorConfig.config.readOnly = true;
    }

    $onInit() {
        this.sql = this.card.getCardQuery();
    }
}

truedashApp.component('appExplainCardSql', {
    controller: ExplainCardSqlController,
    templateUrl: 'content/card/explain/sql/explainCardSql.html',
    bindings: {
        card: '='
    }
});
