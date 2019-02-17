'use strict';

class AppEventsService {
    constructor(ChurnzeroService, AppcuesService, FreshchatService) {
        this.AppcuesService = AppcuesService;
        this.ChurnzeroService = ChurnzeroService;
        this.FreshchatService = FreshchatService;
        
        this.appcuesEvents = {
            'login': 'Login',
            'created-card': 'Created Card',
            'edited-kpi-box': 'Edited KPI Box',
            'created-dashboard': 'Created Dashboard',
            'added-profile-photo': 'Added Profile Photo',
            'added-card-to-favourites': 'Added Card To Favourites',
        };
    }
    
    init(user) {
        this.AppcuesService.init(user);
        this.ChurnzeroService.init(user);
        this.FreshchatService.init(user);
    }
    
    track(name, metadata = {}) {
        if(this.appcuesEvents[name]) {
            this.AppcuesService.track(this.appcuesEvents[name], metadata);
        }
        
        this.ChurnzeroService.track(name, metadata);
        this.FreshchatService.track(name, metadata);
    }
    
    reset() {
        this.ChurnzeroService.reset();
        this.FreshchatService.reset();
    }
}

truedashApp.service('AppEventsService', AppEventsService);
