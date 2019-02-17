'use strict';

import {RoleService} from '../data/RolesHelper';
import {Config} from '../../config';

class FullstoryService {
    constructor() {
        this.user = null;
    }
    
    init(user) {
        if (Config.isDev) return;
        
        this.user = user;
        
        if(this.user.id) {
            this.load();
            
            window.FS && window.FS.identify(user.id, {
                displayName: user.fullName,
                email: user.username,
                organisation_str: user.organisation.name,
                organisationId_int: user.organisation.id,
                userId_int: user.id,
                userType_str: RoleService.getTitleById(user.role)
            });
        }
    }
    
    load() {
        /* jshint ignore:start */
        window['_fs_debug'] = false;
        window['_fs_host'] = 'fullstory.com';
        window['_fs_org'] = 'E0H1Y';
        window['_fs_namespace'] = 'FS';
        (function(m,n,e,t,l,o,g,y){
            if (e in m) {if(m.console && m.console.log) { m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].');} return;}
            g=m[e]=function(a,b){g.q?g.q.push([a,b]):g._api(a,b);};g.q=[];
            o=n.createElement(t);o.async=1;o.src='https://'+_fs_host+'/s/fs.js';
            y=n.getElementsByTagName(t)[0];y.parentNode.insertBefore(o,y);
            g.identify=function(i,v){g(l,{uid:i});if(v)g(l,v)};g.setUserVars=function(v){g(l,v)};g.event=function(i,v){g('event',{n:i,p:v})};
            g.shutdown=function(){g("rec",!1)};g.restart=function(){g("rec",!0)};
            g.consent=function(a){g("consent",!arguments.length||a)};
            g.identifyAccount=function(i,v){o='account';v=v||{};v.acctId=i;g(o,v)};
            g.clearUserCookie=function(){};
        })(window,document,window['_fs_namespace'],'script','user');
        /* jshint ignore:end */
    }
}

truedashApp.service('FullstoryService', FullstoryService);
