'use strict';

import HighchartBarData from './highchartBarData';
import HighchartCardType from './highchartCardType';
import HighchartConfig from './highchart.config';

export default class HighchartMixedData extends HighchartBarData {
    constructor(card, chartOptions) {
        super(card, chartOptions);

        this.HighchartCardType = new HighchartCardType(this.card);
    }

    generate() {
        super.generate();
        this.setTypes();
    }

    setTypes() {
        this.chartOptions.series.forEach((serie, index) => {
            let metricId = _.get(serie, 'custom.metric.id', false);
    
            if(metricId) {
                let type = this.card.chartSettings.metricChartType(metricId);
                let useSymbols = this.card.chartSettings.metricIsUsingSymbols(metricId);
                
                serie.type = HighchartCardType.getType(type, this.card.chartSettings.getJson().fillChart);
                
                if(useSymbols) {
                    serie.marker = { radius: HighchartConfig.marker.radius };
                }
            } else {
                serie.type = index ? 'column' : this.HighchartCardType.get();
            }
        });
    }
}
