'use strict';

import HighchartPieData from './highchartPieData';

export default class HighchartDonutData extends HighchartPieData {
    constructor(card, chartOptions) {
        super(card, chartOptions);

        this.pieOptions.innerSize = '50%';
    }
}
