'use strict';

import Tabs from '../common/tabs';
import './relation/relation.factory';
import './sidebar/relationshipBuilderSidebar.component';
import './relationshipBuilder.service';
import '../builder/formulas/validMathExpression.directive';

class RelationshipBuilderCtrl {

    constructor(DeregisterService, $scope, RelationFactory, $rootScope, DateRangeService, RelationshipBuilderService,
                RelationshipCacheHelperService, $state, toaster, $q) {
        this.$q = $q;
        this.$state = $state;
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.RelationFactory = RelationFactory;
        this.RelationshipBuilderService = RelationshipBuilderService;
        this.RelationshipCacheHelperService = RelationshipCacheHelperService;

        this.watchers = DeregisterService.create($scope);
        this.DateRangeModel = DateRangeService.create();

        this.letters = [];
        this.showFormula = true;

        this.hiddenLabels = ['allTime', 'cardDateRange', 'last7Days', 'last30Days', 'last4Weeks',
                             'last3Months', 'last6Months', 'last12Months'];

        this.hiddenPreviousLabels = [...this.hiddenLabels, 'today', 'week', 'month', 'quarter', 'year', 'fiscalYear'];

        this.tabs = new Tabs(['relation', 'preview']);
        this.tabs.activate(this.$state.params.tab);

    }

    $onInit() {
        this.watchers.onRoot('relationshipBuilder.relation.selected', (event, relation) => {
            this.relation && this.relation.off(null, null, this);
            this.relation = relation;

            if(this.relation) {
                this.refreshFormula();
                this.refreshMetricData();

                this.relation.on('driver.added goal.added', (driver) => {

                    this.dataLoading = true;
                    this.RelationshipBuilderService.getMetricData(driver, this.relation).then((data) => {
                        return this.watchers.timeout(() => {
                            driver.setValues(data);
                        });
                    }).finally(() => {
                        this.dataLoading = false;
                    });
                }, this);
                this.relation.on('driver.added driver.removed', () => this.refreshFormula(), this);
            }
        });

        this.setupSortable();
    }

    setupSortable() {
        this.sortableOptions = {
            handle: '.metric-btn',
            items: 'tr:not(.goal-metric-row)',
            stop: () => {
                this.relation.resetDriverLetters();
                this.refreshFormula();
            }
        };
    }

    setTab(tab) {
        this.tabs.activate(tab);
        this.$state.go('.', {tab: tab}, {notify: false});
    }

    refreshFormula() {
        return this.watchers.timeout(() => {
            this.letters = this.relation.letters;
            this.showFormula = false;
            return this.watchers.timeout(() => {
                this.showFormula = true;
            });
        });
    }

    save() {
        if(this.form.$invalid) return;

        this.loading = true;

        let promise = this.relation.id ? this.update() : this.create();

        promise.finally(() => {
            this.loading = false;
        });
    }

    create() {
        return this.RelationshipBuilderService.create(this.relation).then((relation) => {
            this.RelationshipCacheHelperService.addOrUpdate(relation);

            this.$state.go('.', {relationId: relation.id}, {notify: false});

            this.toaster.success('Relation created');
        });
    }

    update() {
        return this.RelationshipBuilderService.update(this.relation).then((relation) => {
            this.RelationshipCacheHelperService.addOrUpdate(relation);

            this.toaster.success('Relation updated');
        });
    }

    remove() {
        this.RelationshipBuilderService.remove(this.relation).then(() => {
            this.RelationshipCacheHelperService.remove(this.relation);

            this.cancel();

            this.toaster.success('Relation deleted!');
        });
    }

    cancel() {
        this.$rootScope.$broadcast('relationshipBuilder.cancel');
    }

    removeDriver(driver) {
        this.relation.removeDriver(driver);
    }

    hasData() {
        return this.relation.drivers.length || this.relation.goal;
    }

    updatePreviousDates(dates, range) {
        this.relation.previous = {
            fromDate: moment(dates.startDate),
            toDate: moment(dates.endDate),
            rangeName: range
        };
    }

    updateCurrentDates(dates, range) {
        this.relation.current = {
            fromDate: moment(dates.startDate),
            toDate: moment(dates.endDate),
            rangeName: range
        };
    }

    getDateFromRange(range) {
        this.DateRangeModel.setRange({value: range});
        return this.DateRangeModel.getFromTo();
    }

    getCurrentDateString() {
        let dates = this.getDateFromRange(this.relation.current.rangeName);
        return `${dates.from.format('MMMM Do, YYYY')} - ${dates.to.format('MMMM Do, YYYY')}`;
    }

    getPreviousDateString() {
        let dates = this.getDateFromRange(this.relation.previous.rangeName);
        return `${dates.from.format('MMMM Do, YYYY')} - ${dates.to.format('MMMM Do, YYYY')}`;
    }

    get formulaPlaceholder() {
        if(!this.relation.drivers.length) return 'Please select driver metrics first';

        return 'Enter your formula for Goal, e.g. ( A * B ) + C';
    }

    calculate() {
        this.dataLoading = false;
        this.refreshMetricData();
    }

    refreshMetricData() {
        this.dataLoading = true;

        let promises = [];

        if(this.relation.goal) promises.push(
            this.RelationshipBuilderService.getMetricData(this.relation.goal, this.relation).then((data) => {
                return this.watchers.timeout(() => {
                    this.relation.goal.setValues(data);
                });
            })
        );

        this.relation.drivers.forEach(driver => {
            promises.push(this.RelationshipBuilderService.getMetricData(driver, this.relation).then((data) => {
                return this.watchers.timeout(() => {
                    driver.setValues(data);
                });
            }));
        });

        return this.$q.all(promises).finally(() => {
            this.watchers.timeout(() => {
                this.dataLoading = false;
            });
        });
    }
}

truedashApp.component('appRelationshipBuilder', {
    controller: RelationshipBuilderCtrl,
    templateUrl: 'content/relationshipBuilder/relationshipBuilder.html'
});
