'use strict';

import './dexiIntegration.service';
import DexiIntegration from './dexiIntegration.model';

class DexiIntegrationCtrl {
    constructor($confirm, Auth, DexiIntegrationService) {
        this.Auth = Auth;
        this.$confirm = $confirm;
        this.DexiIntegrationService = DexiIntegrationService;
        
        this.dexi = new DexiIntegration();
        this.items = [];
        this.integrations = [];
    }
    
    $onInit() {
        this.loading = true;
    
        this.getIntegrations();
        
        if(this.items.length) {
            this.dexi = this.items[0];
        }
        
        this.loading = false;
    }
    
    get connected() {
        return this.dexi.accountId && this.dexi.accessToken;
    }
    
    setup() {
        this.setupMode = true;
    }
    
    connect() {
        this.error = '';
        this.connecting = true;
        
        this.DexiIntegrationService.create(this.dexi.getJson()).then(response => {
            this.dexi = new DexiIntegration(response);
            this.setupMode = false;
        }).catch((error) => {
            this.error = error.message;
        }).finally(() => {
            this.connecting = false;
        });
    }
    
    delete() {
        return this.$confirm({
            title: 'Delete Integration',
            text: `Are you sure you want to delete this integration? This change cannot be undone.`,
            ok: 'Delete',
            cancel: 'Cancel'
        }).then(() => {
            this.error = '';
            this.deleting = true;
    
            this.DexiIntegrationService.delete(this.dexi.getJson()).then(response => {
                this.dexi = new DexiIntegration();
            }).catch(() => {
                this.error = error.message;
            }).finally(() => {
                this.deleting = false;
            });
        });
    }
    
    getIntegrations() {
        this.items = this.integrations.filter(item => item.type === 'dexi').map(item => {
            return new DexiIntegration(item);
        });
    }
}

truedashApp.component('appDexiIntegration', {
    controller: DexiIntegrationCtrl,
    templateUrl: 'content/profile/organisation/integrations/dexi/dexiIntegration.html',
    bindings: {
        integrations: '=',
    },
});





