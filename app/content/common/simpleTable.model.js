export class SimpleTableModel {

    constructor() {
        /** @type {String[]} **/
        this.columns = [];
        this.data = [];
    }

    update(inputData){
        this.columns = inputData.columns;
        this.data = inputData.data;
    }
}
