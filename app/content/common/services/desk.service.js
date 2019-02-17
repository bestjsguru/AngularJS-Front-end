'use strict';

import {Config} from '../../config.js';

class DeskService {
    init() {
        if (Config.isDev) return;
        
        this.load();
    }

    load() {
        /* jshint ignore:start */
        (function()
            {
                var element = document.createElement("script"); element.type = "text/javascript";
                element.async = true; element.src = "//cdn.desk.com/assets/widget_embed_libraries_191.js";
                document.getElementsByTagName("head")[0].appendChild(element);
            }
        )();
        /* jshint ignore:end */
    }

}

truedashApp.service('DeskService', DeskService);
