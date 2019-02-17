'use strict';

export function sortStringValues(values, fieldName, sortOrder = "ASC") {
    return values.sort(function(a, b) {
        if (sortOrder.toUpperCase() !== "ASC") {
            return b[fieldName].localeCompare(a[fieldName]);
        } else {
            return a[fieldName].localeCompare(b[fieldName]);
        }
    });
}
