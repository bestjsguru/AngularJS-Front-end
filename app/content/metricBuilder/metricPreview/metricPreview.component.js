'use strict';

import {MetricModel} from '../../card/model/metric.model.js';
import {ColumnEntityModel} from '../../card/model/columnEntity.model.js';

class MetricPreviewCtrl {
    constructor($scope, DeregisterService, UserService, MetricDataService) {
        this.$scope = $scope;
        this.UserService = UserService;
        this.metricDataService = MetricDataService;
        this.DeregisterService = DeregisterService;

        this.activeTab = 'details';

        this.filtersCounter = 0;
        this.filtersCounterLoading = false;

        this.watchers = this.DeregisterService.create($scope);
    }

    $onInit() {
        this.metricBuilder = this.parent;
        this.metricBuilder.metricPreview = this;

        this.watchers.onRoot('metric.metricSelected', (event, metricId) => this.onSelectedMetricChanged(metricId));
        this.watchers.onRoot('metric.filtersAmountChanged', () => this.countNumberOfFilters());
        this.$scope.$on('$destroy', () => this.watchers.destroyAll());
    }

    isFiltersBadgeShow(){
        return this.filtersCounter > 0 && !this.filtersCounterLoading;
    }

    countNumberOfFilters() {
        this.filtersCounter = 0;

        if (this.metric && this.metric.rawId) {
            this.filtersCounterLoading = true;
            this.metricDataService.getFilters(this.metric.rawId)
                .then(filters => {
                    this.metricDataService.loadAvailableColumns(this.metric.rawId).then((availableColumns)=> {

                        filters.forEach((filter)=> {
                            if (availableColumns.find(item => item.id == filter.column.id)) {
                                this.filtersCounter++;
                            }
                        });
                        this.filtersCounterLoading = false;
                    });

                });
        }
    }

    onSelectedMetricChanged(selectedMetric) {
        if(selectedMetric === undefined) {
            this.metric = new MetricModel({}, null, {}, {}, this.UserService);
        } else {
            this.metric = this.metricBuilder.metricList.selectedMetric;
        }
        this.countNumberOfFilters();
    }

    show(tab) {
        this.activeTab = tab;
    }

    dataIsVisible() {
        return !!this.metric.id;
    }

    filtersAreVisible() {
        return this.metricBuilder.metricData && !this.metricBuilder.metricData.data.isSqlBased();
    }

    showPreview() {
        return !this.metricBuilder.formVisible;
    }

    showAvailableColumns() {
        return this.metricBuilder.metricData && this.metricBuilder.metricData.isNormal();
    }
}

truedashApp.component('tuMetricPreview', {
    controller: MetricPreviewCtrl,
    templateUrl: 'content/metricBuilder/metricPreview/metricPreview.html',
    restrict: 'E',
    require: {
        parent: '^tuMetricBuilder'
    }
});
