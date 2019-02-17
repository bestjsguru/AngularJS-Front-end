'use strict';

import {EventEmitter} from '../../system/events.js';

class UnreadAlertsService extends EventEmitter {

    constructor(CacheService) {
        super();
        
        this.CacheService = CacheService;
    }
    
    init() {
        this.visible = this.CacheService.get('smartAlerts.message.visible', false);
        this.number = this.CacheService.get('smartAlerts.message.number', 0);
    }
    
    get number() {
        return this._number;
    }
    
    set number(number) {
        this.CacheService.put('smartAlerts.message.number', number);
        
        this._number = number;
    }
    
    get visible() {
        return this._visible;
    }
    
    set visible(visible) {
        this.CacheService.put('smartAlerts.message.visible', visible);
        
        this._visible = visible;
    }
    
    hide() {
        this.number = 0;
        this.visible = false;
    }
}

truedashApp.service('UnreadAlertsService', UnreadAlertsService);
