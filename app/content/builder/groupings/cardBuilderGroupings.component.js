'use strict';

import ConvertGrouping from './convertGrouping';
import './validGroupingName.directive';

class CardBuilderGroupingsController {
    constructor($scope, toaster, DeregisterService) {
        this.$scope = $scope;
        this.toaster = toaster;
        this.DeregisterService = DeregisterService;

        this.watchers = DeregisterService.create(this.$scope);
        this.groupingLoader = [];
        this.showLoader = false;
        this.groupings = [];
        this.forms = this.forms || {};

        this.convertGrouping = new ConvertGrouping();

        this.collapsed = true;
        this.metric = undefined;
    }

    $onInit() {
        this.card = this.cardBuilder.card;

        this.watchers.onRoot('cardBuilderMetrics.selectedMetric', (event, metric) => {
            if(!metric) this.reset();
            this.metric = metric;
            this.initGroupings();
        });
        this.watchers.onRoot('grouping.addForColumn', (event, column) => {
            let grouping = this.addNewGrouping(false, column);
            
            this.watchers.timeout(() => {
                this.applyGrouping(this.getIndex(grouping));
            });
        });
        this.watchers.onRoot('filter.addForColumn', (event, column) => this.collapsed = true);
        this.watchers.onRoot('cardBuilderMetrics.removedMetric', (event, metric) => {
            if(!this.metric) return;

            if(this.metric.id === metric.id) this.reset();
        });

        // We have to reinitiate groupings in case when grouping is removed because it can happen from outside of this directive
        // for example if we are adding new metric that has different columns existing groupings will be removed
        this.card.groupings.on('removed', () => this.initGroupings());
    }

    toggle() {
        this.collapsed = !this.collapsed;
    }

    reset() {
        this.groupings = [];
        this.metric = undefined;
    }

    get showGroupings() {
        return this.card && this.metric && this.groupings.length;
    }

    get loading() {
        return this.cardBuilder.loading;
    }

    initGroupings() {
        this.groupings = [];
        // Add existing groupings first
        this.card.groupings.forEach(value => {
            var grouping = this.addNewGrouping(value);
            grouping.added = true;
        });
    }

    onGroupByNullClick(grouping) {
        grouping.applyGroupByNull = !grouping.applyGroupByNull;
        
        this.watchers.timeout(() => {
            this.applyGrouping(this.getIndex(grouping));
        });
    }

    onGroupingNameChange(grouping) {
        this.watchers.timeout(() => {
            this.applyGrouping(this.getIndex(grouping));
        });
    }
    
    onColumnValueChange(grouping) {
        this.watchers.timeout(() => {
            this.applyGrouping(this.getIndex(grouping));
        });
    }

    addNewGrouping(grouping, column) {

        var newGrouping = {id: null, name: '', card: this.card.id, values: undefined, applyGroupByNull: true};

        if(column) {
            // make sure filters section is visible
            this.collapsed = false;

            // we cannot add same column twice
            if(this.columnAlreadyAdded(column)) return;

            newGrouping.column = column;
        }

        if (grouping) {
            newGrouping.id = grouping.id;
            newGrouping.name = grouping.name;
            newGrouping.column = grouping.column;
            newGrouping.values = grouping.values;
            newGrouping.applyGroupByNull = grouping.applyGroupByNull;
            this.groupings.push(newGrouping);
        } else {
            // Or we are adding new (blank) grouping
            this.groupings.push(newGrouping);
        }

        return newGrouping;
    }

    columnAlreadyAdded(column) {

        if(!column) return false;

        return this.groupings.find(item => item.column.id == column.id);
    }

    removeGrouping(index) {

        this.groupings[index].deleting = true;

        if (index >= this.card.groupings.length) {
            this.groupings.splice(index, 1);
        } else {
            this.card.columnSorting.sortOrder = [];
            this.card.groupings.remove(index).then(() => {
                this.groupings.splice(index, 1);
            });
        }
    }

    applyGrouping(index) {
        if(index < 0) return;
        
        // Validate form fields
        var fieldsToValidate = ['name'];
    
        if (!this.validateFormFields(index, fieldsToValidate, true)) return;
        
        let groupingData = this.groupings[index];

        let groupingWithSameNameAlreadyExists = _.map(this.card.groupings.items, (grouping) => {
            return grouping.name || grouping.column.displayName || grouping.column.name;
        }).includes(groupingData.name || groupingData.column.displayName || groupingData.column.name);
        
        if (index >= this.card.groupings.length) {
            if (groupingWithSameNameAlreadyExists) {
                this.initGroupings();
            } else {
                this.card.columnSorting.sortOrder = [];

                if (this.card.groupings.length === 1 && this.card.types.type === 'pie') {
                    this.card.frequencies.set("Total");
                }
                this.card.groupings.add(groupingData);
            }
        } else {
            this.card.groupings.update(index, groupingData);
        }
    }
    
    getIndex(grouping) {
        return this.groupings.findIndex(item => {
            return item.id === grouping.id &&
                   item.column.displayName === grouping.column.displayName &&
                   item.column.name === grouping.column.name;
        });
    }
    
    validateFormFields(index, fieldsArray, triggerValidation = false) {
        let formIsValid = true;
        let form = this.forms['grouping_' + index + '_form'];
        
        fieldsArray.forEach((formControl) => {
            if (!form[formControl]) return;
            
            if(triggerValidation) {
                // Mark all fields as dirty because that will trigger validation
                form[formControl].$dirty = true;
                form[formControl].$pristine = false;
            }
            
            // Check if field is invalid
            if (form[formControl].$dirty && form[formControl].$invalid) formIsValid = false;
        });
        
        return formIsValid;
    }

    onShowGroupingsAsPercentageClick() {
        this.card.showGroupingAsPercentage = !this.card.showGroupingAsPercentage;
        this.card.metrics.loadData();
    }

    isGroupLoading(index) {
        return this.groupingLoader[index] === true;
    }
}

truedashApp.component('appCardBuilderGroupings', {
    controller: CardBuilderGroupingsController,
    templateUrl: 'content/builder/groupings/cardBuilderGroupings.html',
    require: {
        cardBuilder: '^appBuilder'
    }
});

