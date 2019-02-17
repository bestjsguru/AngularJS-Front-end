'use strict';

export default class DexiIntegration {
    constructor(data) {
        data = data || {};
        
        this.init(data);
    }

    init(data) {
        this.type = 'dexi';
        
        this.id = data.id;
        this.name = data.name || 'Dexi Connection';
        this.description = data.description || 'Avora to Dexi.io';
        this.enabled = !!data.enabled;
        
        this.accessToken = _.get(data, 'props.accessToken', null);
        this.accountId = _.get(data, 'props.accountId', null);
    }

    getJson() {
        let data = {
            type: this.type,
            name: this.name,
            description: this.description,
            enabled: this.enabled,
            props: {
                accessToken: this.accessToken,
                accountId: this.accountId,
            }
        };
        
        if(this.id) {
            data.id = this.id;
        }
        
        return data;
    }
}
