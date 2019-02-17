'use strict';

import './kpiModal.component';
import './kpiMetricData.component';
import './kpiMetricTrend.component';
import './kpi.service';

class KpiCtrl {
    constructor($uibModal, KpiService, $rootScope) {
        this.$uibModal = $uibModal;
        this.$rootScope = $rootScope;
        this.KpiService = KpiService;
        
        this.loading = false;
        this.metrics = [];
    }

    $onInit() {
        this.loadMetrics();
    }
    
    loadMetrics() {
        this.loading = true;
        this.metrics = [];
        
        this.KpiService.getMetrics().then((metrics) => {
            this.metrics = metrics;
        }).finally(() => {
            this.loading = false;
        });
    }
    
    selectMetrics() {
        this.kpiModal && this.kpiModal.dismiss();
        this.kpiModal = this.$uibModal.open({
            component: 'appKpiModal',
            size: 'md',
        });
        
        // When list of metrics is updated we need to refresh metric data
        this.kpiModal.result.then(() => {
            this.loadMetrics();
        });
    }

    refresh() {
        this.$rootScope.$broadcast('kpi.refresh');
    }
}

truedashApp.component('appKpi', {
    controller: KpiCtrl,
    templateUrl: 'content/home/kpi/kpi.html',
});
