'use strict';

class ActivityCtrl {
    constructor() {
    }
}

truedashApp.directive('tuActivity', () => {
    return {
        restrict: 'E',
        bindToController: true,
        controllerAs: 'activity',
        controller: ActivityCtrl,
        templateUrl: 'content/profile/activity/activity.html'
    }
});
