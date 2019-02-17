'use strict';

import {EventEmitter} from '../system/events.js';

export default class ColumnPosition extends EventEmitter {
    constructor(card) {
        super();
        
        this.card = card;
        this.items = [];
        this.dimensions = [];
    }
    
    init(positions) {
        this.initItems();
    
        positions = positions || [];
        
        // Reorder items based on order received from BE
        if(positions.length) {
            let items = positions.reduce((items, position) => {
                let index = this.items.findIndex(item => {
                    return item.id === position.id && item.type === position.type;
                });
    
                if(index >= 0) {
                    // If element is found we remove it from this.items and push it to sorted items.
                    items = [...items, ...this.items.splice(index, 1)];
                }
                
                return items;
            }, []);
    
            // In the end we add all remaining items to sorted items array.
            items = [...items, ...this.items];
    
            this.items = items;
        }
    
        this.trigger('loaded');
    }
    
    initItems() {
        this.items = [];
        
        this.card.groupings.items.forEach((item) => {
            this.items.push({
                id: item.column.id,
                name: item.column.name,
                dimensionName: item.name,
                label: item.column.getLabel(),
                type: 'dimension',
                hidden: false,
                value: item,
            });
        });
        
        this.card.metrics.items.forEach((item) => {
            this.items.push({
                id: this.card.metrics.getMetricId(item),
                name: item.label,
                label: item.label,
                type: this.card.metrics.getMetricType(item),
                hidden: item.isHidden(),
                value: item,
            });
        });
    }
    
    splitDimensions() {
        this.dimensions = [];
        
        // if(this.card.frequencies.isTotalSelected()) return;
        
        this.dimensions = this.items.filter(item => item.type === 'dimension');
        this.items = this.items.filter(item => item.type !== 'dimension');
    }
    
    prioritizeGroupingsWithValues() {
        this.items = _.sortBy(this.getJson(), (item) => {
            if(item.type !== 'dimension') return Number.MAX_VALUE;
    
            let position = this.card.groupings.items.findIndex(grouping => grouping.column.id === item.id);
            
            return position >= 0 ? position : Number.MAX_VALUE;
        });
    }
    
    getJson(includeHidden = true) {
        let items = [...this.dimensions, ...this.items];
        
        items = items.map(item => ({
            id: item.id,
            name: item.name,
            dimensionName: item.dimensionName,
            type: item.type,
            hidden: item.hidden,
        }));
    
        // Add missing dimensions from card to the beginning of column positions
        // Because dimensionName can change we need to update existing items
        this.card.groupings.items.forEach((item) => {
            let existingItem = items.find(position => {
                return position.id === item.column.id && position.type === 'dimension';
            });
    
            if(existingItem) {
                existingItem.dimensionName = item.name;
            } else {
                items.unshift({
                    id: item.column.id,
                    name: item.column.name,
                    dimensionName: item.name,
                    type: 'dimension',
                    hidden: false,
                });
            }
        });
    
        // Add missing metrics from card at the end of column positions
        this.card.metrics.items.forEach((item) => {
            let exists = items.find(position => {
                return position.id === this.card.metrics.getMetricId(item) && position.type === this.card.metrics.getMetricType(item);
            });
            
            // Skip hidden metrics if not requested
            if(!includeHidden && item.isHidden()) return;
        
            !exists && items.push({
                id: this.card.metrics.getMetricId(item),
                name: item.label,
                type: this.card.metrics.getMetricType(item),
                hidden: item.isHidden(),
            });
        });
    
        // Remove metrics and dimensions that doesn't exist on card level
        items = items.filter(position => {
            if(position.type === 'dimension') {
                return this.card.groupings.items.find(item => {
                    return position.id === item.column.id;
                });
            }
        
            return this.card.metrics.items.find(item => {
                return position.id === this.card.metrics.getMetricId(item);
            });
        });
    
        if(!includeHidden) {
            items = items.filter(item => !item.hidden);
        }
        
        return items.map(item => ({
            id: item.id,
            name: item.name,
            dimensionName: item.dimensionName,
            type: item.type,
        }));
    }
    
    getVisibleJson() {
        return this.getJson(false);
    }
    
    findMetricIndex(metric) {
        return this.items.filter(item => !item.hidden).findIndex(item => item.id === this.card.metrics.getMetricId(metric));
    }
    
    findMultiheaderMetricIndex(metric) {
        let offset = this.items.filter(item => item.type === 'dimension').length;
        let index = this.items.filter(item => !item.hidden && item.type !== 'dimension').findIndex(item => item.id === this.card.metrics.getMetricId(metric));
        
        return index + offset;
    }
    
    reset() {
        this.items = [];
        this.dimensions = [];
    }
}
