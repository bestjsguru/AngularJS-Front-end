'use strict';

import {Expression} from '../../common/parser/expression.helper';

function validLogicalExpression() {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            filters: '='
        },
        link: (scope, element, attrs, ngModel) => {
            ngModel.$validators.logicalExpression = (modelValue, viewValue) => {
                var expressionString = modelValue || viewValue;

                if(scope.filters && !scope.filters.length && (!expressionString  || expressionString == '')){
                    return true;
                }

                try {
                    var expression = new Expression(['(', ')', 'and', 'or']);
                    var expressionObject = expression.parse(expressionString);

                    // Extract expression variables in order to compare if something is missing
                    var variables = expressionObject.variables();

                    // Evaluate expression and get results
                    expressionObject = expressionObject.evaluate(generateVariablesObject());

                    // Validate that all filters are present
                    ngModel.$validators.allVariablesPresent = () => allFiltersApplied(variables);

                    // If we have undefined as a result then something went wrong and expression is invalid
                    return expressionObject !== undefined;

                } catch (e) {
                    return false;
                }
            };

            // We set value of every variable inside this formula to zero
            // If all variables are valid numbers - there must be a valid result
            var generateVariablesObject = function () {
                var returnObject = {};
                scope.filters.forEach(filter => returnObject[filter.chainLetter.toLowerCase()] = 0);

                return returnObject;
            };

            var allFiltersApplied = function (variables) {
                var allFiltersApplied = true;
                var filters = scope.filters.filter(filter => filter.chainLetter).map(filter => filter.chainLetter.toLowerCase());

                // Check if all filters exist in variables list
                filters.forEach(filter => {
                    if (variables.indexOf(filter.toLowerCase()) == -1) allFiltersApplied = false;
                });

                return allFiltersApplied;
            };
        }
    };
}

truedashApp.directive('appValidLogicalExpression', validLogicalExpression);
