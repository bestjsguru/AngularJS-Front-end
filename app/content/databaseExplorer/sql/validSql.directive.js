truedashApp.directive('appValidSql', () => {
    "use strict";
    return {
        restrict: 'A',
        require: 'ngModel',
        link: (scope, elem, attr, ctrl) => {

            ctrl.$validators.validSql = (modelValue, viewValue) => {
                if (!viewValue) return false;

                return true;
                // return !! viewValue.match(/^(SELECT\s(?:DISTINCT)?[A-Za-z0-9_\*\)\(,\s\.'\+\|\:=]+?)\s(?:FROM\s[\w\.]+)/img);
            };

            // If we need to validate SQL via api this is how we do it
            // ctrl.$asyncValidators.sql = (modelValue, viewValue) => {
            //     if (!viewValue) return false;
            //     return DataProvider.post('metric/validateSql', {sql: viewValue});
            // };
        }
    };
});
