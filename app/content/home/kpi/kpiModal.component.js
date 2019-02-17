'use strict';

import './kpi.service';

class KpiModalCtrl {
    constructor(KpiService, $q, MetricService, AppEventsService) {
        this.KpiService = KpiService;
        this.MetricService = MetricService;
        this.AppEventsService = AppEventsService;
        this.$q = $q;
        
        this.loading = false;
        this.metrics = [];
        this.selectedMetrics = [];
    }

    $onInit() {
        this.loadMetrics();
    }
    
    loadMetrics() {
        this.loading = true;
        
        let promises = [this.MetricService.getList(), this.KpiService.getMetrics()];
        
        this.$q.all(promises).then((responses) => {
            this.metrics = responses[0];
            this.selectedMetrics = responses[1];
        }).finally(() => {
            this.loading = false;
        });
    }
    
    isSelected(metric) {
        return this.selectedMetrics.find(item => item.id === metric.id);
    }
    
    select(metric) {
        this.selectedMetrics.push(metric);
    }
    
    remove(metric) {
        this.selectedMetrics = this.selectedMetrics.filter(item => item.id !== metric.id);
    }
    
    save() {
        this.KpiService.selectMetrics(this.selectedMetrics).then(() => this.close());
    
        this.AppEventsService.track('edited-kpi-box');
    }
}

truedashApp.component('appKpiModal', {
    controller: KpiModalCtrl,
    templateUrl: 'content/home/kpi/kpiModal.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
