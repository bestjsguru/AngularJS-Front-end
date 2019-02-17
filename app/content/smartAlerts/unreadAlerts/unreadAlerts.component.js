'use strict';

import './unreadAlerts.service';

class UnreadAlerts {
    constructor(Auth, UnreadAlertsService, $rootScope) {
        this.UnreadAlertsService = UnreadAlertsService;
        this.UnreadAlertsService.init();
        this.$rootScope = $rootScope;
        
        Auth.on('login', () => this.UnreadAlertsService.visible = true);
        Auth.on('logout', () => this.UnreadAlertsService.hide());
    }
    
    get visible() {
        return this.UnreadAlertsService.visible && this.UnreadAlertsService.number;
    }
    
    get number() {
        return this.UnreadAlertsService.number;
    }
    
    hide($event) {
        $event.stopPropagation();
        $event.preventDefault();
        
        this.UnreadAlertsService.hide();
    }
    
    openPanel($event) {
        $event.stopPropagation();
        $event.preventDefault();
        
        this.$rootScope.$broadcast('homeAlerts.show');
    }
}

truedashApp.component('appUnreadAlerts', {
    controller: UnreadAlerts,
    templateUrl: 'content/smartAlerts/unreadAlerts/unreadAlerts.html',
});
