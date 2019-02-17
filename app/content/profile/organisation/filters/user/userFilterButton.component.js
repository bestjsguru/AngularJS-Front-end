'use strict';

import '../modal/entityFilterModal.component';

class UserFilterButtonController {
    constructor($uibModal) {
        this.$uibModal = $uibModal;
    }
    
    openModal() {
        this.$uibModal.open({
            size: 'lg',
            component: 'appEntityFilterModal',
            resolve: {
                user: () => this.user,
            }
        });
    }
}

truedashApp.component('appUserFilterButton', {
    controller: UserFilterButtonController,
    templateUrl: 'content/profile/organisation/filters/user/userFilterButton.html',
    bindings: {
        user: '=',
    }
});
