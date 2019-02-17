'use strict';

class DrillRecordsHeaderCtrl {
    $onInit() {
        this.date = null;
        this.groupings = [];
    
        this.card.drill.on('drillDown', () => {
            this.date = this.card.drill.date;
            this.groupings = this.card.groupings.items.filter(grouping => grouping.values.length);
        }, this);
    }
    
    hideRecords() {
        this.card.drill.hideRecords();
    }
    
    $onDestroy() {
        this.card.drill.off(null, null, this);
    }
}

truedashApp.component('appDrillRecordsHeader', {
    controller: DrillRecordsHeaderCtrl,
    templateUrl: 'content/card/expand/drill/records/header/drillRecordsHeader.html',
    bindings: {
        card: '='
    }
});
