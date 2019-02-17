"use strict";

truedashApp.directive('tuEquals', function() {
    return {
        restrict: 'A', // only activate on element attribute
        require: 'ngModel', // get a hold of NgModelController
        link: function(scope, elem, attrs, ngModel) {
            // watch own value and re-validate on change
            scope.$watch(attrs.ngModel, function() {
                validate(ngModel.$modelValue);
            });

            // revalidate on focusing in and out of element
            elem.on('focus blur mouseleave', function() {
                validate(ngModel.$modelValue);
            });

            // observe the other value and re-validate on change
            attrs.$observe('equals', function() {
                validate(ngModel.$modelValue);
            });

            var validate = function(value) {
                ngModel.$setValidity('equals', value === attrs.tuEquals);
                return value;
            };

            ngModel.$parsers.push(function(value) {
                return validate(value);
            });
        }
    };
});

truedashApp.directive('appAccess', ['ngIfDirective', 'Auth', function(ngIfDirective, Auth) {
    let ngIf = ngIfDirective[0];

    return {
        transclude: ngIf.transclude,
        priority: ngIf.priority - 1,
        terminal: ngIf.terminal,
        restrict: ngIf.restrict,
        link: function(scope, element, attributes) {
            // find the initial ng-if attribute
            let initialNgIf = attributes.ngIf, ifEvaluator;
            let level = attributes.level || null;
            let permission = attributes.permission || null;
            
            let checkLevel = level ? Auth.user.canAccess(level) : false;
            let checkPermission = permission ? Auth.user.hasPermission(permission) : false;
            let canAccess = checkLevel || checkPermission;
            
            // if it exists, evaluates ngIf && appAccessLevel
            if (initialNgIf) {
                ifEvaluator = function () {
                    return scope.$eval(initialNgIf) && canAccess;
                };
            } else { // if there's no ng-if, process normally
                ifEvaluator = function () {
                    return canAccess;
                };
            }
            attributes.ngIf = ifEvaluator;
            ngIf.link.apply(ngIf, arguments);
        }
    };
}]);

truedashApp.directive('tuNoPersonalInfo', function() {
    return {
        restrict: 'A', // only activate on element attribute
        require: 'ngModel', // get a hold of NgModelController
        link: function(scope, elem, attrs, ngModel) {
            scope.$watch(attrs.ngModel, function() {
                validate();
            });

            // revalidate on focusing in and out of element
            elem.on('focus blur', function() {
                validate();
            });

            // observe the other value and re-validate on change
            attrs.$observe('noPersonalInfo', function() {
                validate();
            });

            var isContainsPersonalInfo = function(str) {
                if(!str) return false;
                var data = JSON.parse(attrs.tuNoPersonalInfo);
                return ['firstName', 'lastName', 'email'].some(function(key) {
                    if(data[key])
                        return str.indexOf(data[key]) > -1;
                    return false;
                });
            };

            var validate = function() {
                ngModel.$setValidity('noPersonalInfo', !isContainsPersonalInfo(ngModel.$viewValue));
            };
        }
    };
});

truedashApp.directive('tuPasswordPolicies', function() {
    return {
        require: 'ngModel',
        link: function(scope, elem, attr, ngModel) {
            var validations = {
                hasLowerCase: function(str) {
                    return str.toUpperCase() != str;
                },

                hasUpperCase: function(str) {
                    return str.toLowerCase() != str;
                },

                hasNumber: function(str) {
                    var matches = str.match(/\d+/g);
                    return matches != null;
                },

                hasNonAlphanumerics: function(str) {
                    return str.match(/\W/g) != null;
                }
            };

            var valid = true,
                validCount = 0;

            //For DOM -> model validation
            ngModel.$parsers.unshift(function(value) {
                validCount = 0;
                for(var key in validations) {
                    if(validations[key](ngModel.$viewValue))
                        validCount++;
                }

                valid = validCount >= 4;
                // If field is empty we set valid to be TRUE
                ngModel.$setValidity('policies', value ? valid : true);
                return value;
            });

            //For model -> DOM validation
            ngModel.$formatters.unshift(function(value) {
                ngModel.$setValidity('policies', valid);
                return value;
            });
        }
    };
});
