"use strict";

export class RangeModel {

    constructor(data  = {}) {
        this.from = data.from || 0;
        this.to = data.to || 0;
    }

    getJson(){
        return {
            from: this.from,
            to: this.to
        };
    }
}
