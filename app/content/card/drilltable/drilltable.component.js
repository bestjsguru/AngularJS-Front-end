'use strict';

import {Helpers} from '../../common/helpers.js';
import {DataTransformer} from '../chart/dataTransform.js';

class DrilltableCtrl {
    constructor($filter, $rootScope, $element, DeregisterService, $scope) {
        this.isLoading = false;
        this.columns = [];
        this.currentColumn = false;
        this.userIsInteracting = false;
        this.$scope = $scope;
        this.$filter = $filter;
        this.$element = $element;
        this.$rootScope = $rootScope;

        this.watchers = DeregisterService.create($scope);
    }

    $postLink() {
        this.widthElement = this.$element.find('table.datatable-body').parent()[0];
        this.scrollElement = this.$element.find('.scroller');

        this.watchers.onRoot('highchart.point.mouseover', (e, point) => {
            this.$scope.$apply(() => {
                this.currentColumn = point.index;
                this.scrollTable(this.currentColumn);
            });
        });

        this.watchers.onRoot('highchart.mouseout', () => {
            this.$scope.$apply(() => {
                this.currentColumn = false;
            });
        });
    }

    $onInit() {
        this.card = this.explore.card;
        this.data = this.getData();

        this.columns = this.getColumns();

        this.card.metrics.on('loaded', this.refreshDrillTable, this);
        this.card.drill.on('reset', this.refreshDrillTable, this);
        this.watchers.onRoot('refreshDrillTable', () => this.refreshDrillTable());
    }

    refreshDrillTable() {
        this.currentColumn = false;
        this.scrollElement.scrollLeft(0);
        this.data = this.getData();
        this.columns = this.getColumns();
        this.$scope.$broadcast('perfectScrollbar:refresh');
    }

    scrollTable(index) {
        if(this.userIsInteracting || index === false) return;

        let tableWidth = this.widthElement.scrollWidth - this.widthElement.clientWidth;
        let ratio = index / this.getColumns().length;

        if (ratio > 0.94) ratio = 1;

        this.scrollElement.scrollLeft(parseInt(tableWidth * ratio));
    }

    getColumns() {

        let dataTransformer = new DataTransformer({
            metrics: this.card.metrics.items,
            xAxis: this.card.xAxis,
            card: this.card
        });

        return dataTransformer.getDateValues().map(value => {
            if (this.card.types.get() == 'funnel')
                return this.card.getDateRangeString();
            else
                return Helpers.formatDate(this.card.frequencies.selected, {
                    isPieDonut: this.isPieDonut(),
                    withYear: this.isPieDonut()
                })(value);
        });
    }

    processValue(column) {
        return column || 'Total';
    }

    getData() {
        var metrics = this.card.metrics.getVisibleMetrics(this.card.metrics.getNonEmptyMetrics());

        if (this.card.groupings.length && !(this.card.drill.isCardDrill() && this.card.drill.isTotal())) {
            metrics = this.card.metrics.getMetricBasedData(metrics);
        }
        return metrics;
    }

    isPieDonut() {
        return ['pie', 'donut'].includes(this.explore.getType());
    }

    formatMetricValue(value, metric) {
        return this.$filter('format')(value, metric.getYAxisInfo());
    }

    focusColumn(index) {
        this.userIsInteracting = true;
        this.currentColumn = index;
        this.$rootScope.$broadcast('highchart.showTooltip', {index});
    }

    unfocusColumns() {
        this.userIsInteracting = false;
        this.currentColumn = false;
        this.$rootScope.$broadcast('highchart.hideTooltip');
    }

    $onDestroy() {
        this.card.drill.off(null, null, this);
        this.card.metrics.off(null, null, this);
    }
}

truedashApp.component('appDrilltable', {
    controller: DrilltableCtrl,
    templateUrl: 'content/card/drilltable/drilltable.html',
    require: {
        explore: '^tuExplore'
    }
});
