'use strict';

export default class ConvertFormula {

    toText(formula) {

        let text = `<span class="formula text-capitalize">${formula.data.name}</span> ${formula.data.expression}`;

        return text;
    }
}
