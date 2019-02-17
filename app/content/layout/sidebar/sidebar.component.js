'use strict';

import './sidebarDashboards.component';
import './userMenu/sidebarUserMenu.component';

class SidebarCtrl {
    
    constructor($state, $scope, DeregisterService) {
        this.$state = $state;
        this.watchers = DeregisterService.create($scope);
        
        // This is required in order to refresh permission list after user groups are updated
        window.Auth.on('permission-updated', () => {
            this.loading = true;
            
            this.watchers.timeout(() => {
                this.loading = false;
            });
        }, this);
    }
    
    $onDestroy() {
        window.Auth.off(null, null, this);
    }
    
    get isEmbed() {
        return window.Location.isEmbed;
    }

    get isExport() {
        return window.Location.isExport;
    }

    isLinkActive(link) {
        return link && this.$state.is(link);
    }
}

truedashApp.component('tuSidebar', {
    templateUrl: 'content/layout/sidebar/sidebar.html',
    controller: SidebarCtrl
});
