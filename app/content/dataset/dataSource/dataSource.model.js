'use strict';

import {EventEmitter} from '../../system/events';

export class DataSourceModel extends EventEmitter {
    constructor(data) {
        super();
        
        data = data || {};
    
        this.id = data.id;
        this.type = data.type;
        this.name = data.name || 'Unknown Source';
    }
    
    get unknown() {
        return this.name === 'Unknown Source';
    }
}
