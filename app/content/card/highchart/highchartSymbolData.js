'use strict';

import HighchartLineData from './highchartLineData';
import HighchartConfig from './highchart.config';

export default class HighchartSymbolData extends HighchartLineData {
    constructor(card, chartOptions) {
        super(card, chartOptions);
    }

    generate() {
        super.generate();
        this.setSymbols();
    }

    setSymbols() {
        this.chartOptions.series.forEach((serie) => {
            serie.marker = { radius: HighchartConfig.marker.radius };
        });
    }
}
