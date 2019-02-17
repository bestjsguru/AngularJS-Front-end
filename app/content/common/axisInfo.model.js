"use strict";

const SYMBOL_TYPE_MAP = {
    '£': 'currency',
    '€': 'currency',
    '$': 'currency',
    '%': 'currency',
    '123': 'numeric',
    'time': 'time',
};

export class AxisInfo {

    constructor(type, symbol) {
        this.type = type;
        this.symbol = symbol;

        if(!type && symbol){
            this.type = AxisInfo.getTypeWithSymbol(this.symbol);
        }
    }

    static getTypeWithSymbol(symbol){
        let mappedVal = SYMBOL_TYPE_MAP[symbol];

        if(mappedVal){
            return mappedVal;
        }
    }

}
