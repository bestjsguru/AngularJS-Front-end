/**
 * Validate that input field contains list of valid emails separated by commas [,]
 *
 * Example usage: <textarea name="emails" ng-model="emails" multiple-emails></textarea>
 */
truedashApp.directive('tuMultipleEmails', function() {
    var EMAIL_REGEXP = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-z0-9-]+(\.[a-z0-9-]+)*$/i;

    function validateAll(ctrl, validatorName, value) {
        var validity = ctrl.$isEmpty(value) || value.split(',').every(
                function(email) {
                    return EMAIL_REGEXP.test(email.trim());
                }
            );

        ctrl.$setValidity(validatorName, validity);
        return validity ? value : undefined;
    }

    return {
        restrict: 'A',
        require: 'ngModel',
        link: function postLink(scope, elem, attrs, modelCtrl) {
            function multipleEmailsValidator(value) {
                return validateAll(modelCtrl, 'tuMultipleEmails', value);
            };

            modelCtrl.$formatters.push(multipleEmailsValidator);
            modelCtrl.$parsers.push(multipleEmailsValidator);
        }
    };
});