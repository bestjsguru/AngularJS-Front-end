'use strict';

import {Expression} from '../../common/parser/expression.helper';

function validMathExpression() {

    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            inputs: '='
        },
        link: (scope, element, attrs, ngModel) => {
            // We set value of every variable inside this formula to zero
            // If all variables are valid numbers - there must be a valid result
            let generateVariablesObject = function () {
                return scope.inputs.reduce((variables, item) => {
                    variables[item[0].toLowerCase()] = 0;

                    return variables;
                }, {});
            };

            ngModel.$validators.mathExpression = (modelValue, viewValue) => {
                let expressionString = modelValue || viewValue;

                try {
                    let expression = new Expression(['(', ')', '+', '-', '/', '*']);
                    let expressionObject = expression.parse(expressionString);

                    // Evaluate expression and get results
                    expressionObject = expressionObject.evaluate(generateVariablesObject());

                    // If we have undefined as a result then something went wrong and expression is invalid
                    return expressionObject !== undefined;

                } catch (e) {
                    return false;
                }
            };

        }
    };
}

truedashApp.directive('appValidMathExpression', validMathExpression);
