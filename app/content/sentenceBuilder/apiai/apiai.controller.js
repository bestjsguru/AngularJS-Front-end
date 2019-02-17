'use strict';

import CodemirrorConfig from '../../common/codemirror/codemirrorConfig';

export default class ApiaiController {
    constructor($scope, ApiaiService, DeregisterService, MetricService, $state) {
        this.$state = $state;
        this.ApiaiService = ApiaiService;
        this.MetricService = MetricService;
        this.MetricCollection = MetricService.createCollection();
        this.watchers = DeregisterService.create($scope);
        
        this.codemirrorConfig = new CodemirrorConfig();
        this.codemirrorConfig.convertToInput();
        this.codemirrorConfig.disableKeywords();
        this.codemirrorConfig.removeHighlighting();
    }
    
    $onInit() {
        this.hasToken = !! this.ApiaiService.tokens.client;
        this.sentence = '';
        this.response = null;
        this.metrics = [];
        this.entries = [];
    
        if(this.hasToken) {
            this.loadMetrics();
            this.loadEntries();
        }
    }
    
    create() {
        this.response = null;
        this.metric = null;
        this.error = false;
        
        this.ApiaiService.send(this.sentence).then(response => {
            this.watchers.timeout(() => {
                this.response = response;
                
                if(this.findMetric()) {
                    this.createCard(); return;
                }
                
                this.error = true;
            });
        });
    }
    
    findMetric() {
        
        if(this.response.isError()) return false;
        
        return this.metrics.find(metric => this.formatMetricLabel(metric.label) === this.response.metricName);
    }
    
    loadEntries() {
        this.entries = [];
        
        return this.ApiaiService.getEntries().then((entries) => {
            return this.watchers.timeout(() => {
                this.entries = entries;
                this.randomEntries = _.shuffle(this.entries.map(item => item.value));
                
                this.setupExamples();
                
                this.codemirrorConfig.setTables(this.entries.map((entry) => {
                    return {
                        text: entry.value,
                    };
                }));
            });
        });
    }
    
    loadMetrics() {
        return this.MetricService.getAll(false, true).then((metrics) => {
            return this.watchers.timeout(() => {
                this.metrics = _.reverse(this.MetricCollection.sortMetricsBy(metrics, 'label'));
            });
        });
    }
    
    formatMetricLabel(label) {
        return _.unescape(label).replaceAll(['(', ')', '"', '.', ','], '');
    }
    
    createCard() {
        window.SessionCardData.set(this.response, this.findMetric());
        this.$state.go('cardBuilder', {}, {reload: true});
    }
    
    setupExamples() {
        this.examples = [
            {
                text: `Get me ${this.randomEntries[0]} data`,
                html: `Get me <kbd>${this.randomEntries[0]}</kbd> data`,
            },
            {
                text: `${this.randomEntries[1]} we had two days ago`,
                html: `<kbd>${this.randomEntries[1]}</kbd> we had <kbd>two days ago</kbd>`,
            },
            {
                text: `How many ${this.randomEntries[2]} we had last year?`,
                html: `How many <kbd>${this.randomEntries[2]}</kbd> we had <kbd>last year</kbd>?`,
            },
        ];
    }
}
