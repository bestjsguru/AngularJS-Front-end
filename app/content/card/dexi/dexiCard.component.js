'use strict';

import './table/dexiTable.component';
import './link/dexiLink.component';
import Tabs from '../../common/tabs';

class DexiCardCtrl {
    constructor($scope, AppEventsService, DeregisterService) {
        this.$scope = $scope;
        this.AppEventsService = AppEventsService;
    
        this.tabs = new Tabs(['link', 'table']);
    
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.card = this.resolve.card;
        this.link = this.resolve.link;
        
        this.AppEventsService.track('used-dexi-mode');
    
        this.watchers.onRoot('dexiLink.selected', (event, link) => {
            this.link = link;
        });
        
        this.watchers.onRoot('dexiLink.process', (event, link) => {
            this.tabs.activate('table');
        });
        
        this.watchers.watch('$ctrl.link', () => {
            if(!this.link) this.tabs.activate('link');
        });
    }
    
    collapse() {
        this.dismiss();
    }
}

truedashApp.component('appDexiCard', {
    controller: DexiCardCtrl,
    templateUrl: 'content/card/dexi/dexiCard.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
