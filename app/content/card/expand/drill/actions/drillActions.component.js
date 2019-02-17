'use strict';

import './save/drillSave.component';

class DrillActionsCtrl{
    constructor($uibModal, DataExportService) {
        this.$uibModal = $uibModal;
        this.DataExportService = DataExportService;
    }
    
    $onInit() {
        this.metrics = this.card.metrics.filter(metric => !metric.isFormula()).map(metric => {
            return {
                id: this.card.metrics.getMetricId(metric),
                name: metric.label,
                type: this.card.metrics.getMetricType(metric),
                numberOfDecimals: metric.numberOfDecimals,
            };
        });
    }
    
    save() {
        this.$uibModal.open({
            size: 'md',
            component: 'appDrillSave',
            resolve: {
                card: () => this.card,
            }
        });
    }
    
    export(type = 'csv') {
        return this.DataExportService.exportCard(type, this.card);
    }
    
    selectMetric(metric) {
        let params = {
            value: null,
            groupings: [],
            metric: metric,
            position: {
                isFixed: true,
                right: 17,
            }
        };
        
        this.card.drill.trigger('showRecordsColumns', params);
    }
}

truedashApp.component('appDrillActions', {
    controller: DrillActionsCtrl,
    templateUrl: 'content/card/expand/drill/actions/drillActions.html',
    bindings: {
        card: '='
    }
});
