'use strict';

import '../modal/entityFilterModal.component';

class GroupFilterButtonController {
    constructor($uibModal) {
        this.$uibModal = $uibModal;
    }
    
    openModal() {
        this.$uibModal.open({
            size: 'lg',
            component: 'appEntityFilterModal',
            resolve: {
                group: () => this.group,
            }
        });
    }
}

truedashApp.component('appGroupFilterButton', {
    controller: GroupFilterButtonController,
    templateUrl: 'content/profile/organisation/filters/group/groupFilterButton.html',
    bindings: {
        group: '=',
    }
});
