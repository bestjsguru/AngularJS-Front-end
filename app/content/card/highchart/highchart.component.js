'use strict';

import './gaugeGoal/gaugeGoal.component';
import './highchartWrapper.service';
import {Config} from '../../config';
import HighchartCardType from './highchartCardType';
import HighchartConfig from './highchart.config';

class HighchartCtrl {

    constructor($window, $element, $scope, HighchartWrapperService, DeregisterService, DataExportService) {
        this.$window = $window;
        this.$element = $element;
        this.DeregisterService = DeregisterService;
        this.DataExportService = DataExportService;
        this.HighchartWrapperService = HighchartWrapperService;

        this.initiated = false;

        this.watchers = this.DeregisterService.create($scope);
    }

    get type() {
        if (this.card.drill.isActive()) {
            return this.card.drill.getType();
        } else {
            return this.card.types.subType == 'mixed' ? 'mixed' : this.card.types.type;
        }
    }

    get chartWidth() {
        let container = this.$element.closest('.chart-container');
        if (!container.length) container = this.$element.parent();
        return container.width();
    }

    $onInit() {
        this.watchers.on('gridsterResizeEnd', _.debounce(this.resizeOnGridster.bind(this), Config.animationSpeed));
        angular.element(this.$window).bind('resize', _.debounce(() => this.fitToCard(), Config.animationSpeed));

        this.watchers.onRoot('highchart.colors.change', this.initiate.bind(this));

        this.card.metrics.on('loaded', this.initiate, this);
        this.card.types.on('updated', this.initiate, this);
        this.card.chartSettings.on('loaded', () => {
            this.initiated && this.initiate();
        }, this);
        this.card.on('trendLineChange', this.initiate, this);
        this.card.on('isTransposeTableChange', this.initiate, this);
        this.card.anomalies && this.card.anomalies.on('updated', this.initiate, this);
        if(this.card.annotations) {
            this.card.annotations.on('added', this.addAnnotation, this);
            this.card.annotations.on('removed', this.refreshAnnotations, this);
            
            this.bindAnnotationEvents();
        }
        
        this.bindDrillTableEvents();
        this.bindExportingEvents();
        
        this.watchers.watch('$ctrl.card.showMetricTrend', () => {
            !this.card.metrics.loading && this.initiate();
        });
        this.watchers.watch('$ctrl.chartWidth', (newWidth, oldWidth) => {
            if(newWidth && oldWidth === 0 || newWidth && !this.initiated) {
                !this.card.metrics.loading && this.initiate();
            }
        });
    }

    initiate() {
        if(!this.card.isHighchart()) return;

        let options = {
            card: this.card,
            element: this.$element.find('.highchart')[0]
        };

        this.chart = this.HighchartWrapperService.create(options);
    
        this.refreshAnnotations();
        
        // When card has totals highchart height is wrong initially
        // and chart goes out of the card so we need to fit it
        this.card.selectedTotals.length && this.fitToCard();

        this.initiated = true;
    }
    
    getMinimumYAxisValue() {
        let minimum = this.chart.yAxis[0].min;
        
        if(this.chart.yAxis[1].hasVisibleSeries) {
            minimum = Math.min(this.chart.yAxis[0].min, this.chart.yAxis[1].min);
        }
        
        return minimum;
    }
    
    getAnnotationSerie() {
        if(this.chart.get('annotations')) return this.chart.get('annotations');
    
        return this.chart.addSeries({
            yAxis: this.chart.yAxis[0].min === this.getMinimumYAxisValue() ? 0 : 1,
            id: 'annotations',
            name: 'Annotations',
            type: 'line',
            showInLegend: false,
            color: 'transparent',
            allowPointSelect: true,
            tooltip: {pointFormat: ''},
        }, false);
    }
    
    addAnnotation(item) {
        if(!this.chart) return;
        
        if(!(new HighchartCardType(this.card)).hasYAxis() || !this.card.annotations) return;
        
        if(this.chart.xAxis[0].categories && !this.chart.xAxis[0].categories.includes(item.category)) return;
    
        // If annotation already exists on the same place we remove old one in order to replace it with new one with incremented counter
        if(this.getAnnotationSerie().points) {
            let existingPoint =  this.getAnnotationSerie().points.find(point => item.isSibling(point));
        
            existingPoint && existingPoint.remove(false);
        }
    
        let annotationCount = this.card.annotations.filter(annotation => item.isSibling(annotation)).length;
    
        let data = {
            annotation: item,
            title: item.title,
            selected: item.selected,
            marker: {
                radius: 8,
                fillColor: HighchartConfig.colors.annotation.inactive,
                lineWidth: 1,
                lineColor: HighchartConfig.colors.annotation.inactive,
                symbol: 'circle',
                states: {
                    hover: {
                        enabled: false
                    },
                    select: {
                        fillColor: HighchartConfig.colors.annotation.active,
                        lineWidth: 1,
                        lineColor: HighchartConfig.colors.annotation.active,
                    },
                }
            },
            x: item.x,
            y: this.getMinimumYAxisValue(),
            dataLabels: {
                enabled: true,
                align: 'center',
                inside: true,
                style: {
                    color: '#ffffff',
                    'pointer-events': 'none',
                    'letter-spacing': '2px',
                },
                verticalAlign: 'middle',
                overflow: true,
                crop: false,
                x: -1,
                y: -3,
                format: '...'
            }
        };
    
        this.getAnnotationSerie().addPoint(data);
    }
    
    refreshAnnotations() {
        if(!(new HighchartCardType(this.card)).hasYAxis() || !this.card.annotations) return;
    
        this.getAnnotationSerie().remove();
        
        this.card.annotations.forEach(item => this.addAnnotation(item));
    }
    
    bindAnnotationEvents() {
        this.watchers.onRoot('annotations.toggle', (event, annotation) => {
            if(this.chart) {
                let serie = this.getAnnotationSerie();
    
                serie.data.forEach((point) => {
                    annotation.isSibling(point) && point.select();
                });
                
            }
        });
    }

    resizeOnGridster(event, $element) {
        if (!$element) return;

        let isThisCard = this.$element[0] === $element.find(this.$element[0])[0];
        if(!isThisCard || !this.card.isBeingLookedAt()) return;

        this.fitToCard();
    }

    fitToCard() {
        this.watchers.timeout(() => {
            !_.isEmpty(this.chart) && this.chart.reflow();
        }, Config.animationSpeed);
    }

    bindDrillTableEvents() {
        this.watchers.onRoot('highchart.showTooltip', (event, data) => {
            if(this.chart) {
                this.chart.tooltip.hide();
    
                // In some cases we don't use shared tooltips on chart
                // so we have to make sure we have them enabled
                !this.chart.tooltip.shared && this.setSharedTooltip();

                let tooltipData = [];
                this.chart.series.filter(serie => serie.visible).forEach( serie => {
                    serie.data.forEach((point) => point.setState());
                    if(serie.data[data.index] && !serie.data[data.index].drilldown) {
                        serie.data[data.index].setState('hover');
                        tooltipData.push(serie.data[data.index]);
                    }
                });

                tooltipData.length && this.chart.tooltip.refresh(tooltipData);

                if(this.chart.series[0].data[data.index] && !this.chart.series[0].data[data.index].drilldown) {
                    let plotLine = {
                        id: 'xPlotLine',
                        value: this.chart.series[0].data[data.index].x,
                        width: 1,
                        color: '#C0C0C0'
                    };
    
                    if (this.chart.xAxis[0].plotLinesAndBands.length > 0) {
                        this.chart.xAxis[0].update({
                            plotLines: [plotLine]
                        });
                    } else {
                        this.chart.xAxis[0].addPlotLine(plotLine);
                    }
                }
            }
        });

        this.watchers.onRoot('highchart.hideTooltip', (event, data) => {
            if(this.chart) {
                // Revert tooltip to how it was before drilling
                this.revertTooltip();
    
                this.chart.tooltip.hide();
                this.chart.series.forEach(serie => {
                    serie.data.forEach((point) => point.setState());
                });
    
                this.chart.xAxis[0].removePlotLine('xPlotLine');
            }
        });
    }

    revertTooltip() {
        if (this.savedOptions) this.chart.update(this.savedOptions);
        delete this.savedOptions;
    }

    setSharedTooltip() {
        if (!this.savedOptions) this.savedOptions = angular.copy(this.chart.options);

        this.chart.update({
            tooltip: {
                crosshairs: true,
                shared: true,
            }
        });
    }

    bindExportingEvents() {
        this.watchers.onRoot('card.download.' + this.card.id, (event, {type, title, subtitle, timezone = ''}) => {
            if(this.chart) {
                let exportOptions = {
                    filename: this.DataExportService.formatFileName(title)
                };
                
                if(type === 'pdf') exportOptions.type = 'application/pdf';
                if(type === 'svg') exportOptions.type = 'image/svg+xml';
    
                if(timezone) subtitle = subtitle + '<br>' + timezone;
    
                this.chart.exportChart(exportOptions, {
                    chart: {
                        backgroundColor: '#FFFFFF',
                    },
                    title: {text: title},
                    subtitle: {text: subtitle},
                });
            }
        });
    }

    $onDestroy() {
        if(this.chart) {
            this.chart.tooltip.destroy();
            this.chart.destroy();
        }
        
        this.card.off(null, null, this);
        this.card.types.off(null, null, this);
        this.card.metrics.off(null, null, this);
        this.card.chartSettings.off(null, null, this);
        this.card.anomalies && this.card.anomalies.off(null, null, this);
        this.card.annotations && this.card.annotations.off(null, null, this);
    }
}

truedashApp.component('appHighchart', {
    controller: HighchartCtrl,
    templateUrl: 'content/card/highchart/highchart.html',
    bindings: {
        card: '='
    }
});
