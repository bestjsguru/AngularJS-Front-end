'use strict';

import "./editMetric/editMetricDropdown.component";
import "./editMetric/editMetricForm.component";
import Tabs from "../../common/tabs";
import {ColumnHelper} from "./../../card/datatable/column.helper.js";

class CardBuilderMetricsController {
    constructor($q, MetricService, toaster, $state, $stateParams, $rootScope, DeregisterService, $confirm) {
        this.$q = $q;
        this.$state = $state;
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.$stateParams = $stateParams;
        this.$confirm = $confirm;
        this.MetricService = MetricService;
        this.DeregisterService = DeregisterService;
        this.metrics = []; // This will preserve full list of available metrics
        this.availableMetrics = [];
        this.tabs = new Tabs(['metrics']);
        this.loaded = false;
        this.selectedMetric = undefined;

        this.watchers = this.DeregisterService.create();
    }

    $onInit() {
        this.card.metrics.on('added clear removed loaded', this.onCardMetricsUpdated, this);

        this.watchers.onRoot('cardBuilderMetrics.removedMetric', (event, metric) => {
            // if selected metric is removed, unselect it and remove it from url
            if(this.isSelected(metric)) this.selectMetric(metric);
    
            // when metric is removed we also want to remove corresponding total
            this.card.selectedTotals = this.card.selectedTotals.filter(item => item != metric.virtualId);
        });

        this.loading = true;
        var promises = [this.MetricService.getAll(this.card), this.MetricService.getAllCohorts()];
        this.$q.all(promises).then(([metrics, cohorts]) => {
            this.loading = false;
            this.loaded = true;
            this.metrics = [...metrics, ...cohorts];
            this.updateAvailableMetrics();
        }).then(() => {
            this.preselectMetric();
        });
    }

    cardMetricsItems() {
        return ColumnHelper.sortedMetrics(this.card.metrics.items);
    }

    updateAvailableMetrics() {

        if (this.card.metrics.length > 0 && !this.card.metrics.get(0).isSQLBased()) {

            // Because SQL based metrics can only exist alone in a card,
            // Once we select metric that is not SQL based we can not add SQL based metric
            this.availableMetrics = this.metrics.filter((metric) => !metric.isSQLBased());

            return;
        }

        this.availableMetrics = this.metrics.filter((metric) => metric);
    }

    addMetric(metric) {
        if (!this.cardBuilder.cardValidator.canAddMetric(metric)) {
            this.toaster.warning(this.cardBuilder.cardValidator.message);
            return;
        }
    
        if (!this.card.groupings.length) {
            this.addMetricActions(metric);
        } else {
            // check existing grouping columns in new metric available columns
            this.card.filters.loadAvailableColumnsForMetric(metric.rawId).then(availableColumns => {
                let commonColumnNames = availableColumns.map(column => column.name);
                let missingGroupings = [];
    
                if(this.card.groupings.length) {
                    missingGroupings = this.card.groupings
                        .filter(grouping => commonColumnNames.indexOf(grouping.column.name) === -1);
                }

                if (!missingGroupings.length) {
                    // main case when you add metric with all columns
                    this.addMetricActions(metric);
                } else {
                    // open confirm dialog
                    let groupingText = '';
    
                    if(missingGroupings.length) {
                        let missingGroupingsNames = missingGroupings.map(grouping => `<i>${grouping.column.name}</i>`).join(', ');
                        groupingText = `${missingGroupingsNames} column(s) used in grouping`;
                    }
                    
                    this.$confirm({
                        title: 'Dimensions conflict',
                        text: `<b>${metric.name}</b> metric doesn't have ${groupingText}.<br><br> By clicking <b>Add metric</b> you'll add this metric and remove affected card properties <br> or you could press <b>Cancel</b> to keep original state of card.`,
                        ok: 'Add metric',
                        cancel: `Cancel`
                    }).then(() => {
                        let promises = [];
                        
                        missingGroupings.length && promises.push(this.card.groupings.removeGroupings(missingGroupings, false));
                        
                        return this.$q.all(promises);
                    }).then(() => {
                        return this.addMetricActions(metric);
                    });
                }
            });
        }
    }

    addMetricActions(metric) {
        // If we have map metric we can only use map type
        if(metric.isMap()) this.card.types.set('map', 'heat');

        // If we have custom SQL metric we can only use table type
        else if(metric.isSQLBased()) this.card.types.set('table', 'table');

        this.card.columnSorting.sortOrder = [];
        this.card.metrics.checkAndAdd(metric).then(() => {
            // When we add first metric we need to reinitialize formatting
            this.card.metrics.length === 1 && this.card.formatting.init();
            
            this.$rootScope.$emit('cardBuilderMetrics.addedMetric');
        }).catch(error => {
            this.toaster.error('Error while adding metric. ' + error.message);
        });
    }

    canSelect() {
        if (this.loading || this.cardBuilder.loading) return false;
        if (this.card.metrics.length === 0) return true;

        // At this point we already know that we have at least one metric selected

        // Map cards can only have one metric
        if (this.card.types.get() == 'map') return false;

        // If metric is SQL type it can only be one
        if (this.card.metrics.get(0).isSQLBased()) return false;
    
        return !this.card.metrics.isCohort();
    }

    getPlaceholder() {
        return this.loading ? 'Loading metrics...' : 'Select a Metric';
    }

    reloadAvailableMetrics() {
        this.MetricService.getAll(this.card, false).then(metrics => {
            this.metrics = metrics;

            this.updateAvailableMetrics();
        });
    }

    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }

    onCardMetricsUpdated() {
        this.updateAvailableMetrics();
    }

    selectMetric(metric) {
        this.selectedMetric = this.isSelected(metric) ? undefined : metric;

        let metricId = this.selectedMetric ? this.selectedMetric.rawId : null;

        this.$state.go('.', {metricId: metricId}, {notify: false});
        this.$rootScope.$broadcast('cardBuilderMetrics.selectedMetric', this.selectedMetric);
    }

    preselectMetric() {
        if(window.SessionCardData.exists()) {
            let metric = this.availableMetrics.find(item => item.rawId == window.SessionCardData.metricId());
    
            metric && this.addMetric(metric);
        }
        
        if(!this.$stateParams.metricId) return;
        let metric = this.cardMetricsItems().find(item => item.rawId == this.$stateParams.metricId);

        metric && this.selectMetric(metric);
    }

    isSelected(metric) {
        return this.selectedMetric && this.selectedMetric.id === metric.id;
    }

    showMetricHelper() {
        return this.card.metrics.length && !this.selectedMetric;
    }

}

truedashApp.component('appCardBuilderMetrics', {
    bindings: {
        card: '='
    },
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: CardBuilderMetricsController,
    templateUrl: 'content/builder/metrics/cardBuilderMetrics.html'
});
