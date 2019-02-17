'use strict';

var Highcharts = require('highcharts');
require('highcharts/highcharts-more')(Highcharts);

import HighchartLineData from './highchartLineData';
import HighchartConfig from './highchart.config';
import HighchartCardType from './highchartCardType';

export default class HighchartArearangeData extends HighchartLineData {
    constructor(card, chartOptions) {
        super(card, chartOptions);

        this.HighchartCardType = new HighchartCardType(this.card);
        this.useTooltipSymbols = false;
    }

    setData() {
        super.setData();
        this.setTypes();
    }

    setTypes() {

        this.chartOptions.series.forEach((serie) => {
            let metric = this.metrics.find(metric => metric.label === serie.name);

            serie.type = this.card.showMetricTrend ? 'area' : 'line';
            serie.color = HighchartConfig.colors.blue;
            
            if(metric.type === 'arearange') {
                serie.type = 'arearange';
                serie.lineWidth = 0;
                serie.showInLegend = false;
                serie.fillOpacity = 0.2;
                serie.zIndex = 0;
                serie.visible = !this.card.showMetricTrend;
                serie.states = {
                    hover: {
                        enabled: false,
                    }
                };
            }
            
            if(metric.type === 'trendline') {
                serie.type = 'line';
                serie.lineWidth = 1;
                serie.dashStyle = 'Dash';
                serie.visible = !!this.card.showMetricTrend;
            }
            
        });
    }

    convertForAnomalies() {
        if(!this.card.anomalies || this.card.showMetricTrend) return;
        this.chartOptions.legend.enabled = false;
        this.chartOptions.plotOptions.series.marker.enabled = true;

        this.chartOptions.subtitle.style = { color : '#CCCCCC' };
        this.chartOptions.subtitle.text = 'Click on Red/Green points for details';
        this.chartOptions.series.filter(serie => serie.type === 'line').forEach(serie => {
            serie.data = serie.data.map((value) => {
                let anomaly = this.card.anomalies.find(anomaly => +anomaly.data === +value[0]);

                let data = {
                    anomaly: false,
                    marker: { radius: 0 },
                    x: value[0],
                    y: value[1]
                };

                if(anomaly) {
                    data.anomaly = anomaly;
                    data.marker = {
                        radius: HighchartConfig.marker.radius,
                        fillColor: anomaly.isGood ? HighchartConfig.colors.green : HighchartConfig.colors.red,
                        lineWidth: 0.5,
                        lineColor: anomaly.isGood ? HighchartConfig.colors.green : HighchartConfig.colors.red,
                    };
    
                    if(anomaly.alert.read === false) data.marker = {
                        symbol: anomaly.isGood ? HighchartConfig.marker.circle.green : HighchartConfig.marker.circle.red,
                    };
                }

                return data;
            });
        });
    }
}
