'use strict';

import {EventEmitter} from '../../../../system/events';
import {ColumnEntityModel} from '../../../model/columnEntity.model';

export class DrillPresetModel extends EventEmitter {
    constructor(data) {
        super();
        
        data = data || {};
        
        this.originalData = data;
        
        this.id = data.id;
        this.name = data.name;
        this.cardId = data.cardId;
        this.columns = (data.columns || []).map(column => new ColumnEntityModel(column));
    }
    
    getPathLabel() {
        return this.columns.map(column => column.getLabel()).join(' > ');
    }
    
    getLabel() {
        return this.name || this.getPathLabel();
    }
    
    getJson() {
        let data = {
            name: this.name,
            cardId: this.cardId,
            columns: this.columns.map(column => column.id),
        };
        
        if(this.id) data.id = this.id;
        
        return data;
    }
}
