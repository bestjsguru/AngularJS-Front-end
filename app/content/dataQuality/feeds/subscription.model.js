'use strict';

import {EventEmitter} from '../../system/events';

export class SubscriptionModel extends EventEmitter {
    constructor(data) {
        super();
        
        data = data || {};
        
        this.originalData = data;
        
        this.id = data.id;
        this.jobName = data.jobName;
        this.feedName = data.feedName;
        this.datasourceName = data.datasourceName;
        this.app = data.app;
        this.email = data.email;
    }
    
    getKey() {
        return this.jobName + this.datasourceName + this.feedName;
    }
    
    getJson() {
        return {
            jobName: this.jobName,
            feedName: this.feedName,
            datasourceName: this.datasourceName,
            app: !!this.app,
            email: !!this.email,
        }
    }
}
