'use strict';

class CardBuilderTotalsCtrl {
    constructor($scope, DeregisterService) {
        this.$scope = $scope;
        this.DeregisterService = DeregisterService;
        this.watchers = this.DeregisterService.create(this.$scope);

        this.totals = [];
        this.metrics = [];
    }

    $onInit() {
        this.card = this.cardBuilder.card;
        this.watchers.watchCollection('$ctrl.card.selectedTotals', () => this.updateTotals());
        this.watchers.watchCollection('$ctrl.card.metrics.items', () => this.setMetrics());

        this.setMetrics();
        this.updateTotals();
    }

    updateTotals() {
        this.totals = {};
        this.card.selectedTotals.forEach(id => this.totals[id] = true);
    }

    updateCard() {
        this.card.selectedTotals.length = 0;
        for (let id in this.totals) {
            this.totals[id] && this.card.selectedTotals.push(id);
        }
        this.card.metrics.loadData();
    }

    toggleTotal(metric) {
        this.totals[this.getId(metric)] = !this.totals[this.getId(metric)];
        this.updateCard();
    }

    setMetrics() {
        this.metrics = this.card.metrics.items.filter(dataSet => {
            return !dataSet.isFormula() && !(dataSet.isComparable() && dataSet.info.comparedToFormula);
        });
    }

    getPlaceholder() {
        let sufix = this.card.selectedTotals.length > 1 ? 's' : '';

        return `${this.card.selectedTotals.length} Item${sufix} Selected`;
    }

    getId(metric) {
        return metric.virtualId;
    }
}

truedashApp.component('appCardBuilderTotals', {
    controller: CardBuilderTotalsCtrl,
    templateUrl: 'content/builder/totals/cardBuilderTotals.html',
    require: {
        cardBuilder: '^appBuilder'
    }
});
