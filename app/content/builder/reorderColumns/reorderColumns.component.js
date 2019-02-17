'use strict';

class ReorderColumnsController {
    constructor() {
        this.reorderOptions = {
            items: '> .reorder-item'
        };
    }

    $onInit() {
        this.card = this.resolve.card;
    }
    
    save() {
        this.card.columnSorting.sortOrder = [];
        this.card.metrics.reloadData();
        this.card.columnPosition.trigger('loaded');
        this.dismiss();
    }
}

truedashApp.component('appReorderColumns', {
    controller: ReorderColumnsController,
    templateUrl: 'content/builder/reorderColumns/reorderColumns.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
