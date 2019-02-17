'use strict';

import {Config} from '../../config.js';
import {Appcues} from '../../nonBower/appcues/23876';

export class AppcuesService {

    constructor(DeregisterService) {
        this.DeregisterService = DeregisterService;
        this.watchers = this.DeregisterService.create();
    }

    init(user) {
        if (user.id && !Config.isDev && Appcues) {

            Appcues.identify(user.id.toString(), {
                username: user.fullName,
                nameemail: user.username,
                emailcreated_at: moment(user.dateCreated).unix(),
                is_trial: false,
                plan: "enterprise"
            });

            this.watchers.onRoot('$locationChangeSuccess', () => this.startAppcuesOnLocationChangeSuccess());
        }
    }

    startAppcuesOnLocationChangeSuccess() {
        if (!Config.isDev && Appcues) {
            Appcues.start();
        }
    }
    
    track(eventName, metadata = {}) {
        if (Config.isDev) return;
    
        Appcues && Appcues.track(eventName, metadata);
    }

}

truedashApp.service('AppcuesService', AppcuesService);
