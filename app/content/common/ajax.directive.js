"use strict";

truedashApp.directive('loader', ['$http', 'DeregisterService', function ($http, DeregisterService) {

    const PROMISE_RESOLVED_STATE = 2;

    return {
        restrict: 'EA',
        transclude: true,
        scope: {
            ctrlCheck: '&?',
            promise: '=?',
            isEmpty: '=?'
        },
        templateUrl: 'content/common/loader.html',
        replace: true,
        link: function (scope, elm, attrs) {

            elm.addClass('hidden');
            var watchers = DeregisterService.create(scope);
            var fn;

            switch (true){
                case _.isFunction(scope.ctrlCheck):
                    fn = scope.ctrlCheck;
                    break;
                case scope.promise:
                    fn = () => scope.promise.$$state.status !== PROMISE_RESOLVED_STATE;
                    break;
                default:
                    fn = () => $http.pendingRequests.length > 0;
            }

            watchers.watch(fn, (isSwitchedOn) => {
                elm.toggleClass('hidden', !isSwitchedOn);
                scope.isOn = isSwitchedOn;
            });
        }
    };
}]);
