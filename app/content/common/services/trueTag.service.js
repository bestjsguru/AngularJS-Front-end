'use strict';

import {Config} from '../../config.js';

class TrueTagService {
    init(user) {
        if (Config.isDev) return;
        if (user.id) {
            this.load();
            window.avora('newTracker', 'mycljcoll', 'truetag.avora.com', {
                appId: window.location.hostname,
                cookieDomain: window.location.hostname,
                cookieName: 'avora',
                contexts: {
                    webPage: true,
                    performanceTiming: true
                }
            });

            window.avora('setUserId', user.username);
            window.avora('enableActivityTracking', 10, 10);
            window.avora('trackPageView');
        }
    }

    load() {
        /* jshint ignore:start */
            !(function(p,l,o,w,i,n,g){if(!p[i]){p.GlobalSnowplowNamespace=p.GlobalSnowplowNamespace||[];
                p.GlobalSnowplowNamespace.push(i);p[i]=function(){(p[i].q=p[i].q||[]).push(arguments)
                };p[i].q=p[i].q||[];n=l.createElement(o);g=l.getElementsByTagName(o)[0];n.async=1;
                n.src=w;g.parentNode.insertBefore(n,g);
            }}(window,document,"script","//dh48fr8sp13gg.cloudfront.net/sp.js","avora"));
        /* jshint ignore:end */
    }

}

truedashApp.service('TrueTagService', TrueTagService);
