'use strict';

truedashApp.directive('uiSelectRequired', () => {
    return {
        require: 'ngModel',
        link: (scope, elm, attrs, ctrl) => {
            ctrl.$validators.uiSelectRequired = (modelValue, viewValue) => {

                var determineVal;
                if (angular.isArray(modelValue)) {
                    determineVal = modelValue;
                } else if (angular.isArray(viewValue)) {
                    determineVal = viewValue;
                } else {
                    return false;
                }

                return determineVal.length > 0;
            };
        }
    };
});
