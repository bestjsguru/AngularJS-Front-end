'use strict';

String.prototype.replaceAll = function(find, replace) { // jshint ignore:line
    let str = this;
    if (!Array.isArray(find)) {
        find = [find];
    }

    if (!find.length) return str;

    let replaceCharacters = (str, find, replace) => {
        find.forEach(char => {
            str = str.replace(new RegExp(char.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"), 'g'), replace);
        });

        return str;
    };

    return str ? replaceCharacters(str, find, replace) : str;
};

String.prototype.trim = function(character) { // jshint ignore:line
    let str = this;

    if (!character) return str;

    let trimCharacter = (str, character) => {
        const first = [...str].findIndex(char => char !== character);
        const last = [...str].reverse().findIndex(char => char !== character);
        return str.substring(first, str.length - last);
    };

    return str ? trimCharacter(str, character) : str;
};

String.prototype.capitalizeFirstLetter = function() { // jshint ignore:line
    let str = this;

    return str ? str.charAt(0).toUpperCase() + this.slice(1).toLowerCase() : str;
};

String.prototype.includesWord = function(find, separators = [' ']) { // jshint ignore:line
    let str = this;
    let includesWord = false;
    
    if(str === find) return true;
    
    separators.forEach(separator => {
        if(str.startsWith(find + separator)) includesWord = true;
        if(str.endsWith(separator + find)) includesWord = true;
        if(str.includes(separator + find + separator)) includesWord = true;
    });
    
    return includesWord;
    
};
