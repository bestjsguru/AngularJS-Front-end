'use strict';

import {Config} from '../config.js';

class UkMapCtrl {
    constructor($scope, $rootScope, $element, DeregisterService) {
        this.$rootScope = $rootScope;
        this.$element = $element;

        this.areas = ['AB', 'AL', 'B', 'BA', 'BB', 'BD', 'BH', 'BL', 'BN', 'BR', 'BS', 'BT', 'CA', 'CB', 'CF', 'CH', 'CM', 'CO', 'CR', 'CT', 'CV', 'CW', 'DA', 'DD', 'DE', 'DG', 'DH', 'DL', 'DN', 'DT', 'DY', 'E', 'EC', 'EH', 'EN', 'EX', 'FK', 'FY', 'G', 'GL', 'GU', 'HA', 'HD', 'HG', 'HP', 'HR', 'HS', 'HU', 'HX', 'IG', 'IP', 'IV', 'KA', 'KT', 'KW', 'KY', 'L', 'LA', 'LD', 'LE', 'LL', 'LN', 'LS', 'LU', 'M', 'ME', 'MK', 'ML', 'N', 'NE', 'NG', 'NN', 'NP', 'NR', 'NW', 'OL', 'OX', 'PA', 'PE', 'PH', 'PL', 'PO', 'PR', 'RG', 'RH', 'RM', 'S', 'SA', 'SE', 'SG', 'SK', 'SL', 'SM', 'SN', 'SO', 'SP', 'SR', 'SS', 'ST', 'SW', 'SY', 'TA', 'TD', 'TF', 'TN', 'TQ', 'TR', 'TS', 'TW', 'UB', 'W', 'WA', 'WC', 'WD', 'WF', 'WN', 'WR', 'WS', 'WV', 'YO', 'ZE'];
        this.colors = Config.chartOptions.colors.map;
        this.dataSet = {};
        this.legendRectSize = 18;
        this.legendSpacing = 4;

        this.watchers = DeregisterService.create($scope);

        // Wait until all metrics are loaded and then load chart
        this.card.metrics.getLoadPromise().then(() => {
            this.watchers.timeout(this.redraw.bind(this), 200);

            this.watchers.watch('card', this.reloadData.bind(this));

            this.watchers.addWatcher(this.$rootScope.$on('resize', (event, $element) => {
                if (!this.$element.is(':visible') || ($element && this.$element[0] != $element.find('tu-uk-map')[0])) return;
                this.redraw();
            }));
        });

    }

    draw(err, uk) {
        this.ukAreas = uk;
        this.calculateSvgDimensions();
        this.projection = this.makeProjection();
        this.path = this.makePath();
        this.svg = this.makeSvg();
        this.colorScale = this.makeColorScale();
        this.drawPostcodeAreas();
        this.drawPostcodePaths();
        this.drawLegend();
        this.setZoomMode();

    }

    drawLegend() {

        var legendGroup = this.svg.append('g')
            .attr('transform', 'translate(50, 40)')
            .attr('class', 'legend');


        var legend = legendGroup.selectAll('.legend')
            .data(this.colorScale.quantiles())
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr('transform', (d, i) => {
                var height = this.legendRectSize + this.legendSpacing;
                var offset = height * this.colorScale.quantiles().length / 2;
                var horz = -2 * this.legendRectSize;
                var vert = i * height - offset;
                return 'translate(' + horz + ',' + (vert + 80) + ')';
            });

        legend.append('rect')
            .attr('width', this.legendRectSize)
            .attr('height', this.legendRectSize)
            .style('fill', this.colorScale)
            .style('stroke', this.colorScale);

        legend.append('text')
            .attr('x', this.legendRectSize + this.legendSpacing)
            .attr('y', this.legendRectSize - this.legendSpacing)
            .text((d) => {
                if (d < 10) {
                    return '> ' + Math.round(d);
                } else {
                    return '> ' + Math.round(d / 10) * 10;
                }
            });
    }

    makeProjection() {
        return d3.geo.albers()
            .center([5, 53.8])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(1200 * 1.5)
            .translate([this.width / 2, this.height / 1.5]);
    }

    makePath () {
        return d3.geo.path()
            .projection(this.projection);
    }

    makeSvg() {
        return d3.select(this.$element[0]).append('svg')
            .attr('width', this.width)
            .attr('height', this.height);
    }

    makeColorScale() {
        return d3.scale
            .quantile()
            .range(this.colors)
            .domain(d3.map(this.dataSet).values());
    }

     drawPostcodeAreas() {
        this.group = this.svg.append('g');
        this.group.selectAll('.postcode_area')
            .data(topojson.feature(this.ukAreas, this.ukAreas.objects['uk-postcode-area']).features)
            .enter().append('path')
            .attr('class', 'postcode_area')
            .attr('d', this.path)
            .style('fill', (d) => {
                var value = this.dataSet[d.id];
                if (value) {
                    return this.colorScale(value);
                } else {
                    return '#AAA';
                }
            })
            .append('svg:title')
            .attr('transform', (d) => { return 'translate(' + this.path.centroid(d) + ')'; })
            .attr('dy', '.35em')
            .text((d) => { return d.id + ' - ' + this.dataSet[d.id]; });
        return this.group;
    }

    drawPostcodePaths() {
        return this.group.append('path')
            .datum(topojson.mesh(this.ukAreas, this.ukAreas.objects['uk-postcode-area'], (a, b) => a !== b))
            .attr('class', 'mesh')
            .attr('d', this.path);
    }

    setZoomMode() {
        var zoom = d3.behavior.zoom()
            .center([this.width / 2, this.height / 2])
            .scaleExtent([1, 10])
            .on('zoom', this.zoomed.bind(this));
         this.group.call(zoom);
    }

     calculateSvgDimensions () {
         this.width = this.$element.parent().width();

         this.height = this.$element.closest('.chart-container').height();
        if(!this.height) this.height = this.$element.parent().height();

        // Macbook fix
        if(this.height <= 20) {
            this.height = Config.widgetSize.gridsterHeight - 10;

            // If we are in explore mode
            if(this.$element.closest('.card-wrapper-explore').length) this.height = Config.widgetSize.fullSizeHeight;
        }
    }

    zoomed() {
         this.group.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
    }

    redraw() {
         this.$element.find('svg').remove();

        d3.json('content/nonBower/uk-postcode-area.json', this.draw.bind(this));
    }

    reloadData(card) {
        // temporary dummy data
       /* this.areas.forEach((area, index) => {
            this.dataSet[area] = Math.floor(Math.random() * (800 - 30 + 1) + 30);
        })*/
        this.card.metrics.get(0).getData().forEach((item) => {
            this.dataSet[item[0]] = item[1];
        });
    }

}

truedashApp.directive('tuUkMap', tuUkMap);

/* @ngInject */
function tuUkMap () {
    return {
        restrict: 'E',
        scope: {
            card: '='
        },
        controller: UkMapCtrl,
        bindToController: true,
        controllerAs: 'ukMap'
    };
}
