'use strict';

export class EditMetricDropdown {
    constructor($rootScope) {
        this.$rootScope = $rootScope;
    }

    $onInit() {
        this.card = this.cardBuilder.card;
    }

    toggleMetricVisibility() {
        let methodName = this.metric.isHidden() ? 'showMetric' : 'hideMetric';

        this.card.columnSorting.sortOrder = [];
        this.card.metrics[methodName](this.metric);
    }

    removeMetric() {
        this.card.columnSorting.sortOrder = [];
        this.card.metrics.removeMetric(this.metric).then(() => {
            this.$rootScope.$broadcast('cardBuilderMetrics.removedMetric', this.metric);
        });

        // If we are left with only one metric and want to display it as Total frequency
        // we will apply that as numeric, because it will have only one value
        //todo: check Total frequency - should be handled inside card frequencies
        if (this.card.metrics.length <= 2 && this.card.frequencies.selected == 'Total') {
            this.card.types.set('numeric', 'numeric');
        }
    
        // If we remove custom SQL metric we want to reset noSort parameter
        if(this.metric.isSQLBased()) this.card.noSort = false;

    }

    editMetric() {
        this.$rootScope.$broadcast('cardBuilderMetrics.editMetric', this.metric);
    }

    updateCumulativeStatus() {
        this.card.metrics.updateCumulativeStatus(this.metric);
    }

    updateColoring() {
        this.card.metrics.updateColoring(this.metric);
    }

    isCumulative() {
        return this.metric.isCumulative();
    }

    couldBeCumulative() {
        return this.metric.isRegular() && !this.metric.isCohort();
    }

}

truedashApp.component('appEditMetricDropdown', {
    bindings: {
        metric: '='
    },
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: EditMetricDropdown,
    templateUrl: 'content/builder/metrics/editMetric/editMetricDropdown.html'
});
