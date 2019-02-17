'use strict';

class CustomiseDashboardController {
    constructor(CustomiseDashboardModalService) {
        this.CustomiseDashboardModalService = CustomiseDashboardModalService;
    }

    openModal() {
        this.CustomiseDashboardModalService.open();
    }
}

truedashApp.directive('tuCustomiseDashboard', () => {
    return {
        controller: CustomiseDashboardController,
        bindToController: true,
        controllerAs: 'customise',
        restrict: 'A'
    };
});
