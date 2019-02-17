'use strict';

import {RoleService} from '../data/RolesHelper';
import {Config} from '../../config';

class DelightedService {
    constructor() {
        this.user = null;
    }
    
    init(user) {
        if (Config.isDev) return;
        
        this.user = user;
        
        if(this.user.id) {
            this.load();
            
            window.delighted.survey({
                email: user.username,
                name: user.fullName,
                createdAt: user.dateCreated,
                properties: {
                    organisation: user.organisation.name,
                    name: user.fullName,
                    user_id: user.id,
                    user_type: RoleService.getTitleById(user.role)
                },
            });
        }
    }
    
    load() {
        /* jshint ignore:start */
        !function(e, t, r, n, a) {
            if(!e[a]) {
                for(var i = e[a] = [], s = 0; s < r.length; s++) {
                    var c = r[s];
                    i[c] = i[c] || function(e) {
                        return function() {
                            var t = Array.prototype.slice.call(arguments);
                            i.push([e, t]);
                        };
                    }(c);
                }
                i.SNIPPET_VERSION = '1.0.1';
                var o = t.createElement('script');
                o.type = 'text/javascript', o.async = !0, o.src = 'https://d2yyd1h5u9mauk.cloudfront.net/integrations/web/v1/library/' + n + '/' + a + '.js';
                var l = t.getElementsByTagName('script')[0];
                l.parentNode.insertBefore(o, l);
            }
        }(window, document,
            ['survey', 'reset', 'config', 'init', 'set', 'get', 'event', 'identify', 'track', 'page', 'screen', 'group', 'alias'],
            'bzlbiJm2vn97FaQl', 'delighted');
        /* jshint ignore:end */
    }
}

truedashApp.service('DelightedService', DelightedService);
