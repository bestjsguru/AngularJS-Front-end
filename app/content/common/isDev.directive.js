"use strict";

import {Config} from '../config';

let checkIf = function(ngIf, condition) {
    return {
        transclude: ngIf.transclude,
        priority: ngIf.priority - 1,
        terminal: ngIf.terminal,
        restrict: ngIf.restrict,
        link: function(scope, element, attributes) {
            // find the initial ng-if attribute
            let initialNgIf = attributes.ngIf, ifEvaluator;
            
            // if it exists, evaluates ngIf && appAccessLevel
            if(initialNgIf) {
                ifEvaluator = function() {
                    return scope.$eval(initialNgIf) && condition;
                };
            } else { // if there's no ng-if, process normally
                ifEvaluator = function() {
                    return condition;
                };
            }
            attributes.ngIf = ifEvaluator;
            ngIf.link.apply(ngIf, arguments);
        }
    };
};

truedashApp.directive('appIsDev', ['ngIfDirective', function(ngIfDirective) {
    return checkIf(ngIfDirective[0], Config.isDev);
}]);

truedashApp.directive('appIsNotDev', ['ngIfDirective', function(ngIfDirective) {
    return checkIf(ngIfDirective[0], !Config.isDev);
}]);
