'use strict';

import './info/organisationInfo.component';
import './embed/organisationEmbed.component';
import './groups/organisationGroups.component';
import './theme/organisationTheme.component';
import './integrations/integrations.component';
import Tabs from '../../common/tabs';

class OrganisationCtrl {
    
    constructor(OrganisationService, $state) {
        this.$state = $state;
        
        this.tabs = new Tabs(['info', 'embed', 'groups', 'theme', 'integrations']);
        this.tabs.activate(this.$state.params.tab);

        OrganisationService.load().then((organisation) => {
            this.organisation = organisation;
    
            OrganisationService.loadUsers().then(users => this.organisation.setUsers(users));
        });
    
        OrganisationService.on('updated', (organisation) => {
            this.organisation.init(organisation.getData());
        });
    }
    
    setTab(tab) {
        this.tabs.activate(tab);
        this.$state.go('.', {tab: tab}, {notify: false});
    }

    get title() {
        return this.organisation && this.organisation.name;
    }

    get subTitle() {
        if (this.organisation && this.organisation.users && this.organisation.users.length) {
            if (this.organisation.users.length == 1) return '1 member';

            return this.organisation.users.length + ' members';
        }
    }
}

truedashApp.component('appOrganisation', {
    controller: OrganisationCtrl,
    templateUrl: 'content/profile/organisation/organisation.html'
});
