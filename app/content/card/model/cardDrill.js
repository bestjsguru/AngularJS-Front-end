'use strict';

import {EventEmitter} from '../../system/events.js';

import './cardDrillPresets';

class CardDrill extends EventEmitter {
    constructor(card, DataProvider, $q, toaster, CardDrillPresetsFactory) {
        super();
        this.$q = $q;
        /** @type {Card} */
        this.card = card;
        this.toaster = toaster;
        this.DataProvider = DataProvider;
        this.CardDrillPresetsFactory = CardDrillPresetsFactory;
    
        this.value = null;
        this.column = null;
        this.active = false;
        this.isRecords = false;
        this.savedGroupings = null;
        this.presets = this.CardDrillPresetsFactory.create(card);
    }

    init(card) {
    
    }

    getType() {
        return this.card.types.subType === 'mixed' ? 'mixed' : this.card.types.type;
    }

    isActive() {
        return this.active;
    }
    
    isOriginalGrouping(item) {
        return this.savedGroupings.items.find(grouping => grouping.id === item.id);
    }
    
    columnPosition(column) {
        let index = this.card.groupings.items.findIndex(grouping => {
            return grouping.column.id === column.id;
        });
        
        return index >= 0 ? index + 1 : null;
    }
    
    remove(grouping) {
        this.card.groupings.items = _.without(this.card.groupings.items, grouping);
        
        if(this.card.groupings.length) {
            _.last(this.card.groupings.items).setValues([]);
        }
    
        this.trigger('drillDown');
    }
    
    showRecords(value, groupings, columns) {
        if(!this.active) {
            this.saveState();
            this.card.metrics.setPage(1);
        }
        
        this.value = value;
        this.columns = columns;
    
        // We need to add every available columns that is not already used as a group by in order to show every column in a table
        columns.filter(column => {
            return !this.card.groupings.map(grouping => grouping.column.id).includes(column.id);
        }).forEach(column => {
            this.card.groupings.addItem(this.card.groupings.create({
                column: column.getJson(),
                applyGroupByNull: true,
                values: [],
            }));
        });
        
        // Reset all grouping values
        this.card.groupings.forEach(grouping => grouping.setValues([]));
        
        // After that we need to populate selected grouping values
        if(this.card.groupings.length) {
            if(groupings.length) {
                this.card.groupings.forEach(grouping => {
                    let appliedGrouping = groupings.find(item => {
                        return item.column.id === grouping.column.id;
                    });
                    
                    if(appliedGrouping) {
                        grouping.setValues([appliedGrouping.value]);
                    }
                });
            }
        }
    
        this.isRecords = true;
    
        this.trigger('drillDown');
    }
    
    hideRecords() {
        this.date = null;
        this.isRecords = false;
        
        this.card.restoreState();
        
        return this.card.metrics.loadData(true, this.card.drill.withDashboardFilters);
    }

    drillDown(column, value, groupings) {
        if(!this.active) {
            this.saveState();
            this.card.metrics.setPage(1);
        }
        
        this.value = value;
        this.column = column;
        
        if(this.card.groupings.length) {
            if(groupings.length) {
                this.card.groupings.forEach(grouping => {
                    let appliedGrouping = groupings.find(item => {
                        return item.column.id === grouping.column.id;
                    });
        
                    if(appliedGrouping) {
                        grouping.setValues([appliedGrouping.value]);
                    }
                });
            } else {
                _.last(this.card.groupings.items).setValues([this.value]);
            }
        }
    
        this.card.groupings.addItem(this.card.groupings.create({
            column: this.column.getJson(),
            applyGroupByNull: true,
            values: [],
        }));
        
        this.active = true;
        
        this.trigger('drillDown');
    }

    drillByDate(date) {
        this.date = date;
        
        this.card.rangeName = 'custom';
        this.card.fromDate = this.date.from;
        this.card.toDate = this.date.to;
        this.card.frequencies.setState({selected: 'Total'});
        
        this.trigger('drillDown');
    }
    
    setType(type) {

        if (_.isObject(type) && 'type' in type && 'subType' in type) {
            return this.card.types.set(type.type, type.subType);
        }

        switch (type) {
            case 'spline':
            case 'symbol':
            case 'mixed':
                return this.card.types.set('line', type);
            case 'horizontal':
                return this.card.types.set('bar', type);
            default:
                return this.card.types.set(type, type);
        }
    }

    drillUp() {
        this.trigger('drillUp');
    }

    saveState() {
        this.savedType = this.card.types.getState();
        this.savedGroupings = this.card.groupings.getState();
        this.savedPage = this.card.metrics.page;
    }

    restoreState() {
        if(this.savedType) {
            this.card.types.setState(this.savedType);
            this.savedType = null;
        }
    
        if(this.savedGroupings) {
            this.card.groupings.setState(this.savedGroupings);
            this.savedGroupings = null;
        }
        
        if(this.savedPage) {
            this.card.metrics.setPage(this.savedPage);
            this.savedPage = null;
        }
    }

    getState() {
        return {
        
        };
    }

    setState(state) {
    
    }

    getJson() {
        return {
        
        };
    }
}

truedashApp.service('CardDrillFactory', (DataProvider, $q, toaster, CardDrillPresetsFactory) => ({
    create: (card) => { return new CardDrill(card, DataProvider, $q, toaster, CardDrillPresetsFactory)}
}));
