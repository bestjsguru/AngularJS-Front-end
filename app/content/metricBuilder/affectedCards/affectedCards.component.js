'use strict';

export class AffectedCardsController {
    constructor($scope, DeregisterService, DataProvider) {
        this.DataProvider = DataProvider;

        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        this.loaded = false;
        this.cards = [];
        this.metricBuilder = this.parent;
        this.metricBuilder.affectedCards = this;

        this.watchers.watch('$ctrl.metricBuilder.metricList.selectedMetric', this.onSelectedMetricChanged.bind(this));
    }

    onSelectedMetricChanged(selectedMetric) {

        if (selectedMetric.id === undefined) {
            this.loaded = false;
            this.cards = [];
            return;
        }
        
        this.loaded = false;

        this.DataProvider.get('metric/usage/' + selectedMetric.id).then((cards) => {

            // In case multiple requests are loading in parallel we make sure only correct one is updated
            if (this.metricBuilder.metricList.selectedMetric.id != selectedMetric.id) return;

            this.cards = cards;
        }).finally(() => {
            this.loaded = true;
        });
    }

    showLoader() {
        return this.metricBuilder && this.metricBuilder.metricList.selected && !this.loaded;
    }

    showPreview() {
        return this.metricBuilder && !this.metricBuilder.metricList.selected;
    }
}

truedashApp.component('tuAffectedCards', {
    controller: AffectedCardsController,
    templateUrl: 'content/metricBuilder/affectedCards/affectedCards.html',
    restrict: 'E',
    require: {
        parent: '^tuMetricBuilder'
    }
});
