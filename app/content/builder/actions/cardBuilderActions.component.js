'use strict';

import {Config} from '../../config';
import '../reorderColumns/reorderColumns.component';
import '../goal/goal.component';
import '../trendLine/trendLine.component';
import '../chartSettings/chartSettings.component';

class CardBuilderActionsCtrl {
    constructor($timeout, $document, $uibModal) {
        this.$timeout = $timeout;
        this.$document = $document;
        this.$uibModal = $uibModal;
        
        this.card = undefined;
    }
    
    $onInit() {
        this.card = this.cardBuilder.card;
    }
    
    onShowTableTotalsClick() {
        this.card.showTableTotals = !this.card.showTableTotals;
        this.card.metrics.loadData();
    }
    
    onTransposeTableClick() {
        this.card.isTransposeTable = !this.card.isTransposeTable;
        this.card.trigger('isTransposeTableChange');
    }
    
    openTrendLine() {
        this.$uibModal.open({
            size: 'md',
            component: 'appTrendLine',
            resolve: {
                card: () => this.card,
            }
        });
    }
    
    showTwoAxes() {
        return (this.card.metrics.length > 1 || this.card.groupings.length) && !['table', 'numeric', 'pie', 'donut', 'funnel'].includes(
                this.card.types.get());
    }
    
    showValueLabels() {
        return this.card.metrics.length && !['table', 'numeric', 'gauge'].includes(this.card.types.get());
    }
    
    showTrendLine() {
        return this.card.metrics.length && ['line', 'spline', 'symbol', 'bar', 'mixed'].includes(this.card.types.get());
    }
    
    showChartSettings() {
        return this.card.metrics.length && !['table', 'numeric', 'gauge'].includes(this.card.types.get());
    }
    
    showTotals() {
        return this.card.metrics.length && ['table'].includes(this.card.types.get());
    }
    
    showTranspose() {
        // We show transpose button for tables
        let isTable = this.card.metrics.length && ['table'].includes(this.card.types.get());
        
        // or for charts when groupings are applied with total frequency
        let isChart = this.card.metrics.length &&
                      this.card.groupings.length &&
                      this.card.frequencies.isTotalSelected() &&
                      ['line', 'spline', 'symbol', 'bar', 'mixed'].includes(this.card.types.get());
        
        return isTable || isChart;
    }
    
    showAxis() {
        return !['numeric', 'table'].includes(this.card.types.get());
    }
    
    showSql() {
        return this.card.metrics.length && !!this.card.query;
    }
    
    toggleSql() {
        this.card.showSql = !this.card.showSql;
    }
    
    showReorderColumns() {
        return this.card.metrics.length && !['numeric', 'gauge'].includes(this.card.types.get());
    }
    
    openReorderColumns() {
        this.$uibModal.open({
            size: 'md',
            component: 'appReorderColumns',
            resolve: {
                card: () => this.card,
            }
        });
    }
    
    showGoal() {
        return this.card.metrics.length && ['numeric', 'gauge'].includes(this.card.types.get());
    }
    
    openGoal() {
        this.$uibModal.open({
            size: 'md',
            component: 'appGoal',
            resolve: {
                card: () => this.card,
            }
        });
    }
    
    openChartSettings() {
        this.$uibModal.open({
            size: 'md',
            component: 'appChartSettings',
            resolve: {
                card: () => this.card,
            }
        });
    }
}

truedashApp.component('appCardBuilderActions', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: CardBuilderActionsCtrl,
    templateUrl: 'content/builder/actions/cardBuilderActions.html'
});
