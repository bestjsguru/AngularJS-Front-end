'use strict';

import './apiai.service';
import ApiaiController from './apiai.controller';

class ApiaiCtrl extends ApiaiController {
    constructor($scope, ApiaiService, DeregisterService, MetricService, $state) {
        super($scope, ApiaiService, DeregisterService, MetricService, $state);
    }
    
    getResponse() {
        this.response = null;
    
        this.ApiaiService.send(this.sentence).then(response => {
            this.watchers.timeout(() => {
                this.response = response;
            });
        });
    }
    
    panelClass() {
        return {
            'panel-danger': this.response.isError(),
            'panel-info': !this.response.isError(),
            'panel-warning': !this.response.isError() && this.response.message
        };
    }
    
    syncMetricsCommand() {
        let token = this.ApiaiService.tokens.developer;
        let url = 'https://api.api.ai/v1/entities/Metric/entries';
        let entities = JSON.stringify(this.metrics.map((metric) => {
            let label = this.formatMetricLabel(metric.label);
            
            return {
                value: label,
                synonyms: [metric.id, label]
            };
        }));
        
        return `curl -v -i -X PUT -H "Accept:application/json" -H "Content-Type:application/json" -H "Authorization:Bearer ${token}" -d '${entities}' '${url}'`;
    }
}

truedashApp.component('appApiai', {
    controller: ApiaiCtrl,
    templateUrl: 'content/sentenceBuilder/apiai/apiai.html'
});
