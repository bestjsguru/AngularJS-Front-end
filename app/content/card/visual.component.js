'use strict';

class VisualCtrl {
    constructor(DeregisterService, $scope, $element) {
        this.watchers = DeregisterService.create($scope);
        this.$element = $element;
    }

    $postLink() {
        this.watchers.watch('$ctrl.loading', loading => {
            let element = this.$element.find('.card-content');

            loading ? element.addClass('chart-loading') : element.removeClass('chart-loading');
        });
    }
    
    get loading() {
        return this.card.metricsAreLoading();
    }

    get isExport() {
        return window.Location.isExport;
    }

    showVisual() {
        return this.card && (this.card.metrics.getVisibleCount() ||  this.card.formulas.length) && !this.isError;
    }

    showNumeric() {
        if(!this.showVisual()) return false;
        if (this.isNumericAsTable()) return false;
        return this.card.types.get() == 'numeric';
    }

    showDatatable() {
        if(!this.showVisual()) return false;
        if (this.isNumericAsTable()) return true;
        if (this.type == 'table') return true;
        return this.card.types.get() == 'table';
    }

    showUkMap() {
        if(!this.showVisual()) return false;
        return this.card.types.get() == 'map';
    }

    // Helper functions
    isNumericAsTable() {
        return this.card.types.get() == 'numeric' && this.card.metrics.getVisibleCount() > 1;
    }

    showHighchart() {
        return this.showVisual() && this.card.isHighchart() && !this.loading;
    }
}

truedashApp.component('tuVisual', {
    templateUrl: 'content/card/visual.html',
    controller: VisualCtrl,
    bindings: {
        card: '=',
        reload: '&?',
        isError: '=error',
        type: '='
    }
});
