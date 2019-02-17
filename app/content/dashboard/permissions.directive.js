'use strict';

truedashApp.directive('tuPermissions', permissions);

/* @ngInject */
function permissions(UserService, $uibModal) {
    var directive = {
        controller: controller,
        restrict: 'A',
        scope: true
    };
    return directive;

    function controller($scope, $element, $attrs) {
        $scope.openModal = function() {
            var modalInstance = $uibModal.open({
                templateUrl: 'content/dashboard/permissions.html',
                size: 'md',
                controller: function($scope) {
                    $scope.user = UserService.create();
                }
            });
        };
    }
}
