'use strict';

class AddDashboardController {
    constructor(AddDashboardModalService) {
        this.AddDashboardModalService = AddDashboardModalService;
    }

    openModal() {
        this.AddDashboardModalService.open();
    }
}

truedashApp.directive('tuAddDashboard', () => {
    return {
        controller: AddDashboardController,
        bindToController: true,
        controllerAs: 'ad',
        restrict: 'A'
    };
});
