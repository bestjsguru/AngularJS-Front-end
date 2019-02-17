'use strict';

class CardBuilderVisualCtrl {
    $onInit() {
        this.card = this.cardBuilder.card;
        this.cardBuilder.cardBuilderVisual = this;
    }

    isLoading() {
        return !this.cardBuilder.saving && this.cardBuilder.loading;
    }

    isError() {
        return this.cardBuilder.isError || this.card.metrics.error;
    }

    showVisual() {
        return this.card && !this.card.autoReload.hasChanges;
    }

    showChart() {
        if (!this.showVisual()) return false;
        return this.card.metrics.length
               && this.card.isHighchart()
               && !this.card.metrics.error
               && this.card.metrics.getVisibleCount();
    }

    showNumeric() {
        if (!this.showVisual()) return false;
        if (this.isNumericAsTable()) return false;
        return this.card.metrics.length && this.card.types.get() == 'numeric' && this.card.metrics.getVisibleCount();
    }

    isNumericAsTable() {
        return this.card.types.get() == 'numeric' && this.card.metrics.getVisibleCount() > 1;
    }

    showDatatable() {
        if (!this.showVisual()) return false;
        if (this.isNumericAsTable()) return true;
        return this.card.metrics.length
               && this.card.types.get() == 'table'
               && this.card.metrics.get(0).getData()
               && this.card.metrics.getVisibleCount();
    }

    showUkMap() {
        if (!this.showVisual()) return false;
        return this.card.metrics.length && this.card.types.get() == 'map' && !this.isLoading();
    }

    showNoVisibleMetricsOrImage() {
        return !this.card.autoReload.hasChanges && !this.showNoMetricsOrImage() && (!this.card.isImage() && this.showVisual() &&
               !this.card.metrics.getVisibleCount() && !this.isLoading());
    }

    showNoMetricsOrImage() {
        return !this.card.autoReload.hasChanges && (!this.showVisual() || !this.card.metrics.length) && !this.card.isImage() && !this.isLoading();
    }

    showNoDataMessage() {
        return !this.card.autoReload.hasChanges && this.card.metrics.getVisibleCount() && !this.isLoading() &&
               !this.card.hasData() && this.card.types.get() &&
               !this.isTableTypeInCardBuilder();
    }

    isTableTypeInCardBuilder() {
        return this.card.types.get() === 'table';
    }

    showErrorMessage() {
        return !this.card.autoReload.hasChanges && this.isError() && !this.isLoading() && !this.showNoMetricsOrImage() && !this.showNoVisibleMetricsOrImage();
    }

}

truedashApp.component('appCardBuilderVisual', {
    controller: CardBuilderVisualCtrl,
    templateUrl: 'content/builder/visual/cardBuilderVisual.html',
    require: {
        cardBuilder: '^appBuilder'
    }
});
