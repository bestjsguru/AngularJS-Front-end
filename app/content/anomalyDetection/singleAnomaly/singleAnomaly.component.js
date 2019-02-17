'use strict';

class SingleAnomalyController {
    constructor($window, SmartAlertsService, $rootScope, RelationshipBuilderService, $state, DeregisterService, $scope) {
        this.$state = $state;
        this.$window = $window;
        this.$rootScope = $rootScope;
        this.SmartAlertsService = SmartAlertsService;
        this.RelationshipBuilderService = RelationshipBuilderService;
        
        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        this.anomaly = this.resolve.anomaly;
        this.card = this.resolve.card;
    
        this.showAndRead();
    
        this.getRelations();
    }
    
    getRelations() {
        this.rootCauseRelations = [];
        this.RelationshipBuilderService.all().then(relations => {
            this.rootCauseRelations = relations.filter(relation => {
                return relation.goal_metric.metric_id === this.anomaly.metric.id;
            });
        });
    }
    
    showAndRead() {
        if(!this.anomaly.alert.read && this.card.anomalies.has(this.anomaly)) {
            this.SmartAlertsService.read(this.anomaly.alert.id).then(() => {
                this.card.anomalies.read(this.anomaly);
            });
        }
    }
    
    findPrevious() {
        let items = _.clone(this.card.anomalies.items);
        items.sort((a, b) => a.data - b.data);
        let index = items.findIndex((item) => item.alert.id === this.anomaly.alert.id);
        
        return items[index-1] ? items[index-1] : null;
    }
    
    findNext() {
        let items = _.clone(this.card.anomalies.items);
        items.sort((a, b) => a.data - b.data);
        let index = items.findIndex((item) => item.alert.id === this.anomaly.alert.id);
        
        return items[index+1] ? items[index+1] : null;
    }
    
    previous() {
        this.anomaly = this.findPrevious() || this.anomaly;
        
        this.showAndRead();
    
        this.$rootScope.$broadcast('popover.hide');
    }
    
    next() {
        this.anomaly = this.findNext() || this.anomaly;
    
        this.showAndRead();
    
        this.$rootScope.$broadcast('popover.hide');
    }
    
    previousTooltip() {
        return this.findPrevious() && `<i class="fa fa-circle ${this.findPrevious().isGood ? 'text-success' : 'text-danger'}"></i> ${this.findPrevious().formatedDate}`;
    }
    
    nextTooltip() {
        return this.findNext() && `<i class="fa fa-circle ${this.findNext().isGood ? 'text-success' : 'text-danger'}"></i> ${this.findNext().formatedDate}`;
    }
    
    explore(relation) {
        let date = moment(this.anomaly.data);
        
        this.$state.go('rootCause', {
            relationId: relation.id,
            autoCalculate: true,
            current: {
                fromDate: +date.clone().startOf('day'),
                toDate: +date.clone().endOf('day'),
                rangeName: 'custom',
            },
            previous: {
                fromDate: +date.clone().subtract(7, 'days').startOf('day'),
                toDate: +date.clone().subtract(7, 'days').endOf('day'),
                rangeName: 'custom',
            },
        });
    }
    
    createRelation() {
        // We set this temporary variable in order to pass metric data to relationshipBuilder
        // It will be deleted from session as soon as it is read after redirect
        this.$window.relationshipBuilderSession = {
            metric: this.anomaly.metric,
        };
        
        this.$state.go('relationshipBuilder');
    }
    
    anomalyClass(isButton = false, isArrow = false) {
        let classes = {};
        let prefix = isButton ? 'btn-' : '';
        
        classes[prefix + 'success'] = this.anomaly.isGood;
        classes[prefix + 'danger'] = !this.anomaly.isGood;
        
        if(isArrow) {
            classes['fa-arrow-up'] = this.anomaly.isIncrease;
            classes['fa-arrow-down'] = !this.anomaly.isIncrease;
        }
        
        return classes;
    }
}

truedashApp.component('appSingleAnomaly', {
    controller: SingleAnomalyController,
    templateUrl: 'content/anomalyDetection/singleAnomaly/singleAnomaly.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
