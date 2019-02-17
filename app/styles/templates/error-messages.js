'use strict';

truedashApp.run(['$templateCache', $templateCache => {
    $templateCache.put('error-messages', `
        <div ng-message="required">This field cannot be blank</div>
        <div ng-message="minlength">The value for this field is too short</div>
        <div ng-message="maxlength">The value for this field is too long</div>
        <div ng-message="email">You have entered an incorrect email value</div>
        <div ng-message="sqlStar">It is not allowed to select all available columns from the table (using SELECT *). Please select a subset.</div>
        <div ng-message="sqlSortBy">It is not allowed to use any kind of sorting for the table. Please remove SORT BY expression.</div>
    `);
}]);
