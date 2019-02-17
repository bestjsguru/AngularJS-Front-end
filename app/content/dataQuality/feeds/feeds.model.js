'use strict';

let prettyMs = require('pretty-ms');

import {EventEmitter} from '../../system/events';

export class FeedsModel extends EventEmitter {
    constructor(data) {
        super();
        
        data = data || {};
        
        this.originalData = data;
    
        this.id = data.id;
        this.type = data.type;
        this.name = data.name || 'Unknown Source';
        this.feeds = (data.feeds || []).map(feed => {
            return {
                name: feed.feedName,
                jobName: feed.jobName,
                datasourceName: feed.datasourceName,
                frequency: prettyMs((feed.frequency || 0) * 1000, {verbose: true}),
                lastErrorMessage: feed.lastErrorMessage,
                lastRunDuration: prettyMs((feed.lastRunDuration || 0) * 1000, {verbose: true}),
                lastRunStatus: feed.lastRunStatus,
                lastRunTime: moment(feed.lastRunTime).format('Do MMMM YYYY HH:mm:ss'),
                lastRunTimeFromNow: moment(feed.lastRunTime).fromNow(),
                lastStatusCheck: moment(feed.lastStatusCheck),
                schemaName: feed.schemaName,
                tableName: feed.tableName,
                timeZone: feed.timeZone,
                isError: feed.lastRunStatus === 'ERROR',
                getKey() {
                    return feed.jobName + feed.datasourceName + feed.feedName;
                },
                statusClass: () => {
                    if(feed.lastRunStatus === 'ERROR') return 'danger';
                    if(feed.lastRunStatus === 'PAUSED') return 'warning';
        
                    return 'success';
                },
            };
        }).sort((a, b) => b.name - a.name);
    }
    
    get unknown() {
        return this.name === 'Unknown Source';
    }
    
    get alerts() {
        return this.feeds.filter(feed => feed.isError);
    }
}
