'use strict';

import {Config} from '../../config.js';
import {RoleService} from '../data/RolesHelper';

class AnalyticsSegmentService {
    constructor() {
        this.ready = false;
        this.loaded = false;
        this.load();
    }

    load() {
        if (Config.isDev) return;

        this.loaded = true;
        
        // segment analytics injection code, as-is
        !function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on"];analytics.factory=function(t){return function(){var e=Array.prototype.slice.call(arguments);e.unshift(t);analytics.push(e);return analytics}};for(var t=0;t<analytics.methods.length;t++){var e=analytics.methods[t];analytics[e]=analytics.factory(e)}analytics.load=function(t,e){var n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src="https://cdn.segment.com/analytics.js/v1/"+t+"/analytics.min.js";var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(n,a);analytics._loadOptions=e};analytics.SNIPPET_VERSION="4.1.0";
            analytics.load("yUt46FULxEx6mQFlbHQmnbrXqCJR3Dde");
            analytics.page();
        }}();
    }
    
    page(name) {
        this.loaded && this.ready && analytics.page(name);
    }
    
    track(eventName, metadata = {}) {
        if (Config.isDev) return;
    
        this.loaded && this.ready && analytics.track(eventName, metadata);
    }

    init(user) {
        if (!user.id || !this.loaded) return;

        analytics.identify(user.id, {
           name: user.fullName,
           email: user.email,
           createdAt: user.dateCreated,
           organisation: user.organisation.name,
           organisationId: user.organisation.id,
           salesforceId: user.organisation.salesforceId,
           userType: RoleService.getTitleById(user.role)
        });
        
        analytics.ready(() => this.ready = true);
    }

    reset() {
        this.loaded && analytics.reset && analytics.reset();
    }
}

truedashApp.service('AnalyticsSegment', AnalyticsSegmentService);
