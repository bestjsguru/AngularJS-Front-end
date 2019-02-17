'use strict';

import {ROLES} from './data/RolesHelper';

export class Authorize {

    constructor(){
        this.levels = {
            all: [
                ROLES.ROLE_EXTERNAL_USER,
                ROLES.ROLE_VIEW,
                ROLES.ROLE_USER,
                ROLES.ROLE_ADMIN
            ],
            view: [
                ROLES.ROLE_VIEW,
                ROLES.ROLE_USER,
                ROLES.ROLE_ADMIN
            ],
            user: [
                ROLES.ROLE_USER,
                ROLES.ROLE_ADMIN
            ],
            admin: [
                ROLES.ROLE_ADMIN
            ]
        };
    }

    check(level, role = null) {

        // Public level can always be accessible
        if(!role && level == 'public') return true;

        return !!(role && this.levels[level] && this.levels[level].includes(role));
    }

    static isAdmin(role) {
        return ROLES.ROLE_ADMIN === role;
    }
}
