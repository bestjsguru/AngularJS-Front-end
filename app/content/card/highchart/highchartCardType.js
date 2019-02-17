'use strict';

import HighchartConfig from './highchart.config';

export default class HighchartCardType {
    constructor(card) {
        this.card = card;
        this.type = this.card.types.subType;
    }

    get() {
        return HighchartCardType.getType(this.type, this.card.chartSettings.getJson().fillChart);
    }
    
    static getType(type, isFilled) {
        this.typeMap = HighchartConfig.typeMap[isFilled ? 'filled' : 'default'];
        return this.typeMap[type];
    }

    isHighchart() {
        return [
            'line', 'spline', 'symbol', 'mixed', 'bar', 'horizontal', 'sunburst', 'treemap', 'bullet',
            'gauge', 'pie', 'donut', 'funnel', 'arearange', 'scatter', 'bubble', 'sankey',
        ].includes(this.type);
    }
    
    hasYAxis() {
        return [
            'line', 'spline', 'symbol', 'mixed', 'bar', 'horizontal', 'arearange', 'bubble', 'bullet',
        ].includes(this.type);
    }
}
