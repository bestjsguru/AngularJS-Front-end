'use strict';

import {Config} from '../../config.js';

class NewRelicService {
    init() {
        // Disabled completely for now
        return;
        
        if(Config.isLocal) return;
        
        this.load();
    }

    load() {
        let script = document.createElement('script');
        script.setAttribute('src', 'content/nonBower/newRelic/nr.js');
        script.setAttribute('type', 'text/javascript');
        document.getElementsByTagName('head')[0].appendChild(script);
    }
}

truedashApp.service('NewRelicService', NewRelicService);
