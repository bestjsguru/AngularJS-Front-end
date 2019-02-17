'use strict';

import {EventEmitter} from '../system/events.js';
import RegularFormatting from '../builder/formatting/regular/regularFormatting';
import CustomSqlFormatting from '../builder/formatting/customSqlFormatting';

export default class Formatting extends EventEmitter {
    constructor(card) {
        super();
        
        this.card = card;
    
        this.initFormatter();
    }
    
    get items() {
        return this.formatter.items;
    }
    
    set items(items) {
        this.formatter.items = items;
    }
    
    init(items) {
        this.initFormatter();
        
        items = items || [];
        
        if(items.length) {
            // TODO: Validate items array
            
            this.formatter.init(items);
            this.trigger('loaded');
        }
    }
    
    initFormatter() {
        this.formatter = this.card.isCustomSQL() ? new CustomSqlFormatting(this.card) : new RegularFormatting(this.card);
    }
    
    check(value, columns, results, columnIndex, rowIndex) {
        return this.formatter.check(value, columns, results, columnIndex, rowIndex);
    }
    
    getJson() {
        return this.formatter.getJson();
    }
}
