'use strict';

class RelationshipBuilderSidebarCtrl {
    constructor(MetricService, $filter, $rootScope, RelationFactory, DeregisterService, $scope, $window, RelationshipBuilderService, $state) {
        this.$state = $state;
        this.$window = $window;
        this.$filter = $filter;
        this.$rootScope = $rootScope;
        this.MetricService = MetricService;
        this.RelationFactory = RelationFactory;
        this.MetricCollection = MetricService.createCollection();
        this.RelationshipBuilderService = RelationshipBuilderService;

        this.watchers = DeregisterService.create($scope);
        
        this.loadingMetrics = false;
        this.loadingRelations = false;
        this.relation = null;
        this.metrics = [];
        this.sources = [];
        this.relations = [];
        this.metricFilter = '';
    }

    $onInit() {
        this.loadRelations();
        this.loadMetrics();

        this.watchers.watch('$ctrl.$state.params.relationId', (id) => {
            this.loadRelations().then(() => {
                if(id) {
                    this.relations.selected = this.relations.find(relation => relation.id === parseInt(id));
                    return this.relations.selected && this.selectRelation();
                }
            });
        });

        this.watchers.onRoot('relationshipBuilder.cancel', () => {
            this.relation = null;
            this.goalMetric = null;
            delete this.relations.selected;

            this.$rootScope.$broadcast('relationshipBuilder.relation.selected', null);
            this.$state.go('.', {relationId: null}, {notify: false});
        });
        
        if(this.$window.relationshipBuilderSession) {
            this.createRelation();
            this.relation.name = this.$window.relationshipBuilderSession.metric.name;
    
            this.loadMetrics().then(() => {
                this.relation.selectGoal({
                    metric_id: this.$window.relationshipBuilderSession.metric.id,
                    name: this.$window.relationshipBuilderSession.metric.name
                });
                this.selectRelationGoalMetric();
    
                delete this.$window.relationshipBuilderSession;
            });
        }
    }

    loadRelations() {
        this.loadingRelations = true;
        return this.RelationshipBuilderService.all(true).then((relations) => {
            this.relations = [];
            relations.forEach((relation) => {
                this.relations.push(this.RelationFactory.create(relation));
            });
        }).finally(() => {
            this.loadingRelations = false;
        });
    }

    loadMetrics() {
        this.loadingMetrics = true;
        return this.MetricService.getList(true).then((metrics) => {
            this.metrics = this.allMetrics = this.MetricCollection.sortMetricsBySource(metrics);
            this.sources = this.MetricCollection.getMetricsGroupedBySource(metrics);

            // Sometimes user can select relation before metrics are fully
            // loaded so we need to check and preselect in that case
            this.relation && this.selectRelationGoalMetric();
        }).finally(() => {
            this.loadingMetrics = false;
        });
    }

    createRelation() {
        this.relation = this.RelationFactory.create();

        this.$rootScope.$broadcast('relationshipBuilder.relation.selected', this.relation);
    }

    selectRelation() {
        this.relation = this.relations.selected;

        // Metrics can take more time to load so we only select goal metric if they are loaded
        this.metrics.length && this.selectRelationGoalMetric();
        this.sources.length && this.sources.forEach(source => source.collapsed = true);

        this.$rootScope.$broadcast('relationshipBuilder.relation.selected', this.relation);

        this.$state.go('.', {relationId: this.relation.id}, {notify: false});
    }

    selectRelationGoalMetric() {
        if(!this.relation || !this.relation.goal) return;

        this.goalMetric = this.metrics.find(metric => metric.id === this.relation.goal.metric_id);
    }

    getMetricsPlaceholder() {
        return this.loadingMetrics ? 'Loading metrics...' : 'Select a Metric';
    }

    getRelationsPlaceholder() {
        return this.loadingRelations ? 'Loading relations...' : 'Select Existing Relation';
    }

    countDrivers(source) {
        if(this.collapsedState) source = this.collapsedState.find(item => item.name === source.name);

        return this.relation.drivers.filter(driver => {
            return source.metrics.find(metric => metric.id === driver.metric_id);
        }).length;
    }

    selectGoal() {
        this.relation.selectGoal({
            metric_id: this.goalMetric.id,
            name: this.goalMetric.label
        });
    }

    saveCollapsedState() {
        if(this.metricFilter.length && !this.collapsedState) {
            this.collapsedState = _.clone(this.sources);
        }
    }

    applyCollapsedState() {
        if(!this.metricFilter.length && this.collapsedState) {
            this.sources.map(source => {
                this.collapsedState.forEach(state => {
                    if(source.name == state.name) source.collapsed = state.collapsed;
                });
            });

            this.collapsedState = null;
        }
    }

    filter() {
        this.saveCollapsedState();

        this.metrics = this.$filter('customSearch')(this.allMetrics, 'name,label,description,source,type', this.metricFilter);

        this.sources = this.MetricCollection.getMetricsGroupedBySource(this.metrics);
        this.metricFilter.length && this.sources.forEach(source => source.collapsed = false);
        this.applyCollapsedState();
    }
}

truedashApp.component('appRelationshipBuilderSidebar', {
    controller: RelationshipBuilderSidebarCtrl,
    templateUrl: 'content/relationshipBuilder/sidebar/relationshipBuilderSidebar.html'
});
