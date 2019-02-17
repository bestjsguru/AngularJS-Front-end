'use strict';

function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


export var ArrayHelper = {
    without: function (arr, toFind, methodCall) {
        return arr.filter((item) => item[methodCall] != toFind)
    },

    /**
     * Returns all elements that exist in arr1 and are not in arr2
     */
    difference: function (arr1, arr2, propName) {
        return arr1.filter((arr1Item) => !arr2.find(item => item[propName] == arr1Item[propName]));
    },

    /**
     * Returns all elements that are common for arr1 and arr2
     */
    intersect: function (arr1, arr2, propName) {
        return arr1.filter((arr1Item) =>  arr2.find(item => item[propName] == arr1Item[propName]))
    }
};



