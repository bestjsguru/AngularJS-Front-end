truedashApp.directive('tuSqlMetricValidator', () => {
    "use strict";
    return {
        restrict: 'A',
        require: 'ngModel',
        link: (scope, elem, attr, ctrl) => {

            let validate = (modelValue, viewValue, expression) => {
                if (!viewValue) return false;

                let valueToValidate = viewValue.replace(/\s+/g,' ').trim().toLowerCase();

                return valueToValidate.indexOf(expression) === -1;
            };

            ctrl.$validators.sqlStar = (modelValue, viewValue) => {
                return validate(modelValue, viewValue, 'select *');
            };

            ctrl.$validators.sqlSortBy = (modelValue, viewValue) => {
                return validate(modelValue, viewValue, 'sort by');
            };

            // If we need to validate SQL via api this is how we do it
            // ctrl.$asyncValidators.sql = (modelValue, viewValue) => {
            //     if (!viewValue) return false;
            //     return DataProvider.post('metric/validateSql', {sql: viewValue});
            // };
        }
    };
});
