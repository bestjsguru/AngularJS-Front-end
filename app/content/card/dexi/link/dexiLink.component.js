'use strict';

import './dexiLink.service';
import DexiIntegration from '../../../profile/organisation/integrations/dexi/dexiIntegration.model';

class DexiLinkCtrl {
    constructor($scope, $confirm, $rootScope, DeregisterService, DexiLinkService, IntegrationService) {
        this.$confirm = $confirm;
        this.$rootScope = $rootScope;
        this.DexiLinkService = DexiLinkService;
        this.IntegrationService = IntegrationService;
        
        this.watchers = DeregisterService.create($scope);
    }
    
    $onInit() {
        this.error = '';
        this.links = [];
        this.integrations = [];
        this.loading = false;
        this.newConfiguration = false;
        
        this.user = window.Auth.user;
    
        this.initCard().then(() => this.loadDexiIntegrations());
    }
    
    loadDexiIntegrations() {
        this.loading = true;
        
        this.IntegrationService.getAll().then(integrations => {
            this.integrations = integrations.filter(item => item.type === 'dexi').map(item => {
                return new DexiIntegration(item);
            });
        }).finally(() => {
            this.loading = false;
        });
    }
    
    initCard() {
        this.card = null;
    
        return this.watchers.timeout(() => {
            this.card = this.originalCard;
            this.links = this.card.exportLinks.dexi;
        }, 100);
    }
    
    openForm() {
        this.watchers.timeout(() => {
            this.newConfiguration = true;
        });
    }
    
    closeForm() {
        this.watchers.timeout(() => {
            this.displayName = '';
            this.exportLink = '';
            
            this.form.$setPristine();
            this.newConfiguration = false;
        });
    }
    
    getJson() {
        return {
            card: this.card.id,
            exportType: 'dexi',
            integration: 5,
            exportLink: this.exportLink,
            displayName: this.displayName,
        };
    }
    
    select(link) {
        if(this.isSelected(link)) return;
        
        this.link = link;
    
        this.$rootScope.$broadcast('dexiLink.selected', this.link);
    }
    
    isSelected(link) {
        return _.isEqual(this.link, link);
    }
    
    delete(link, $event) {
        $event.stopPropagation();
        $event.preventDefault();
    
        return this.$confirm({
            title: 'Delete Configuration',
            text: `Are you sure you want to delete <strong>${link.displayName}</strong>? This change cannot be undone.`,
            ok: 'Delete',
            cancel: 'Cancel'
        }).then(() => {
            this.deleting = true;
            this.error = '';
    
            this.DexiLinkService.delete(link).then(response => {
                this.links = _.without(this.links, link);
                
                if(this.isSelected(link)) this.link = null;
            }).catch((error) => {
                this.error = error.message;
            }).finally(() => {
                this.deleting = false;
            });
        });
    }
    
    save() {
        if(this.form.$invalid) return;
        
        this.loading = true;
        this.error = '';
        
        this.DexiLinkService.create(this.getJson()).then(link => {
            this.links.push(link);
            this.select(link);
            
            this.closeForm();
        }).catch((error) => {
            this.error = error.message;
        }).finally(() => {
            this.loading = false;
        });
    }
    
    process() {
        if(!this.link) return;
    
        this.$rootScope.$broadcast('dexiLink.process', this.link);
    }
}

truedashApp.component('appDexiLink', {
    controller: DexiLinkCtrl,
    templateUrl: 'content/card/dexi/link/dexiLink.html',
    bindings: {
        link: '=',
        originalCard: '<',
    }
});
