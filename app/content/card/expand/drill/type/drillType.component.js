'use strict';

class DrillTypeCtrl{
    constructor() {
        this.types = ['line', 'spline', 'symbol', 'bar', 'horizontal', 'pie', 'donut'];
    }
    
    getType() {
        if (!this.card) return;
        
        return this.card.types.subType;
    }
    
    setType(type) {
        this.card.drill.setType(type);
    }
}

truedashApp.component('appDrillType', {
    controller: DrillTypeCtrl,
    templateUrl: 'content/card/expand/drill/type/drillType.html',
    bindings: {
        card: '='
    }
});
