'use strict';

import './favouriteCards/favouriteCards.component';
import './kpi/kpi.component';
import {Config} from '../config';

class HomeCtrl {

    constructor(Auth, $uibModal, $state) {
        this.$uibModal = $uibModal;
        this.$state = $state;
        
        this.kpiModal = false;
        this.user = Auth.user;
        
        // External and read-only users dont have home page so we will block any access to home page here
        this.hasHomePage = this.user.canAccess('user');
        if(!this.hasHomePage) this.$state.go('dashboard');
    }
    
    get isExport() {
        return window.Location.isExport;
    }

    get periodOfDay() {
        if([0, 1, 2, 3, 18, 19, 20, 21, 22, 23].includes(new Date().getHours())) return 'evening';
        if([12, 13, 14, 15, 16, 17].includes(new Date().getHours())) return 'afternoon';

        return 'morning';
    }

    get pageSubtitle() {
        return `Good ${this.periodOfDay} ${this.user.firstName}`;
    }
}

truedashApp.component('appHome', {
    controller: HomeCtrl,
    templateUrl: 'content/home/home.html'
});
