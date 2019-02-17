
'use strict';

import HighchartLineData from './highchartLineData';

export default class HighchartBarData extends HighchartLineData {
    constructor(card, chartOptions) {
        super(card, chartOptions);

        this.chartOptions.tooltip.crosshairs = true;
        this.chartOptions.tooltip.shared = true;
    }
}
