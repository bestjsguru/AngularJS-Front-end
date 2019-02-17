'use strict';

import CodemirrorConfig from '../../common/codemirror/codemirrorConfig';

class ColumnSelectorCtrl {

    constructor($timeout) {
        this.codemirrorConfig = new CodemirrorConfig();
        this.codemirrorConfig.disableKeywords();
        this.codemirrorConfig.convertToInput();
    }

    $onInit() {
        this.codemirrorConfig.setTables(this.columns.map(column => ({ text: `${this.table}.${column.name}` })));
    }
}

truedashApp.component('tuColumnSelector', {
    controller: ColumnSelectorCtrl,
    templateUrl: 'content/schemaDesign/columnSelector/columnSelector.html',
    bindings: {
        columns: '=',
        table: '=',
        model: '=',
        placeholder: '@',
        name: '@'
    }
});
