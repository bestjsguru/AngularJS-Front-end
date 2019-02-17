'use strict';

import {Config} from '../../config.js';

class ChurnzeroService {
    init(user) {
        if (Config.isDev) return;
        
        this.user = user;
        
        if(this.user.id && this.user.organisation.salesforceId) {
            window.ChurnZero && window.ChurnZero.push(['setAppKey', '98j2EmC8HNn55O51gtfswPCH8k9YYP0BZYyDuBR2drQ']);
            window.ChurnZero && window.ChurnZero.push(['setContact', user.organisation.salesforceId, user.email]);
    
            window.ChurnZero && window.ChurnZero.push(['setAttribute', 'contact', 'FirstName', user.firstName]);
            window.ChurnZero && window.ChurnZero.push(['setAttribute', 'contact', 'LastName', user.lastName]);
        }
    }
    
    track(eventName, metadata = {}) {
        if (Config.isDev) return;
    
        // Churnzero cannot accept param named ID because that's reserved param name
        if(metadata.id) {
            metadata.avora_id = metadata.id;
            delete metadata.id;
        }
        
        window.ChurnZero && window.ChurnZero.push(['trackEvent', eventName, undefined, undefined, metadata]);
    }

    reset() {
        window.ChurnZero && window.ChurnZero.push(['stop']);
    }
}

truedashApp.service('ChurnzeroService', ChurnzeroService);
