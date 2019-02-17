"use strict";

truedashApp.directive('tuRangeNumber', () => {
    return {
        require: 'ngModel',
        templateUrl: 'content/common/input.range.html',
        link($scope, $el, $attr, ngModel){
            $scope.data = {
                from: undefined,
                to: undefined
            };

            $scope.$watch('data', ngModel.$setViewValue);
        }
    };
});
