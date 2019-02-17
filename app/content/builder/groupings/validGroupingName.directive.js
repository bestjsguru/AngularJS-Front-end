'use strict';

function validGroupingName() {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            grouping: '=',
            groupings: '=',
        },
        link: (scope, element, attrs, ctrl) => {
            ctrl.$validators.groupingName = (modelValue, viewValue) => {
                let name = modelValue || viewValue;
                let groupings = scope.groupings.slice();
                
                if(groupings && !groupings.length && (!name  || name == '')){
                    return true;
                }

                try {
                    
                    if(scope.grouping) {
                        groupings = groupings.filter(grouping => {
    
                            // We cannot check by id because new groupings have empty id property
                            let sameDisplayName = grouping.column.displayName === scope.grouping.column.displayName;
                            let sameName = grouping.column.name === scope.grouping.column.name;
                            
                            return !(sameDisplayName && sameName);
                        });
                    }
                    
                    let hasSameName = _.map(groupings, (grouping) => {
                        return grouping.name || grouping.column.displayName || grouping.column.name;
                    }).includes(name || scope.grouping.column.displayName || scope.grouping.column.name);
                    
                    return !hasSameName;
                    
                } catch (e) {
                    return false;
                }
            };
        }
    };
}

truedashApp.directive('appValidGroupingName', validGroupingName);
