'use strict';

import './social.service';

class SocialCtrl {
    constructor($scope, Auth, SocialService, DeregisterService) {
        this.Auth = Auth;
        this.SocialService = SocialService;
    
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.initConnections();
    }
    
    initConnections() {
        this.loading = true;
        
        this.SocialService.getConnections().then(connections => {
            this.connections = connections;
        }).finally(() => {
            this.loading = false;
        });
    }
    
    remove(item) {
        this.loading = true;
    
        this.SocialService.deleteConnection(item.provider, item.userId).then(() => {
            this.connections = this.connections.filter(connection => {
                return connection.provider.concat(connection.userId) !== item.provider.concat(item.userId);
            });
        }).finally(() => {
            this.loading = false;
        });
    }
    
    connectionClass(item) {
        return {
            'fa-google': item.provider.includes('google'),
            'fa-windows': item.provider.includes('windows')
        }
    }
    
    connectionName(item) {
        if(item.provider.includes('google')) return 'Google';
        if(item.provider.includes('windows')) return 'Windows';
    
        return item.provider;
    }
}

truedashApp.component('appSocial', {
    controller: SocialCtrl,
    templateUrl: 'content/profile/details/social/social.html',
});





