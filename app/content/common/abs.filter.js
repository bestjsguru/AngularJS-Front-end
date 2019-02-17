'use strict';

truedashApp
    .filter('abs', ($filter) => {
        return function (value, info) {
            return Math.abs(value)
        };
    });


