'use strict';

const COLOUR_SCALE = ['#d2eef8' , '#a4dcf1' , '#77cbeb' , '#49b9e4' , '#1ca8dd' ];

export class CohortsColouring{
    constructor($element, $scope) {
        this.$element = $element;
        this.$scope = $scope;

        this.colours = [];
    }

    updateTable() {
        this.$element.find('table.datatable-body tr').each((index, row) => {
            $(row).find('td:gt(0)').each((thIndex, th) => $(th).css('background-color', this.colours[thIndex + 1][index]));
        });
        this.triggerDomUpdate();
    }

    triggerDomUpdate() {
        this.$scope.$emit('perfectScrollbar:refresh');
        this.$element.find('.scroller-y').perfectScrollbar('update');
    }

    prepareColourMatrix(data, isComplexityCohort) {
        if (!data || !data.length) return;

        if (isComplexityCohort) {
            this.complexityCohortColoursCalculate(data);
        } else {
            this.coloursCalculate(data);
        }
    }

    complexityCohortColoursCalculate(data) {
        let values = [];
        data.forEach((row, index) => values = values.concat(row.slice(1)));


        values = values.sort((a, b) => a - b);
        values = _.uniq(values);
        let scale = d3.scale.quantize().domain(values).range(COLOUR_SCALE);

        data[0].forEach((value, index) => {
            if (index === 0) return;

            if (this.colours[index] === undefined)
                this.colours[index] = [];

            data.forEach((rowValue, rowValueIndex) => {
                var dataItem = data[rowValueIndex][index];
                this.colours[index][rowValueIndex] = dataItem === 0 || dataItem == null ? 'white' : scale(dataItem);
            });
        });
    }

    coloursCalculate(data) {
        let values = [];

        data[0].forEach((item, index) => {
            if (index === 0) return;


            values = data.map(row => row[index]).sort((a, b) => a - b);

            let scale = d3.scale.quantize().domain(values).range(COLOUR_SCALE);

            if (this.colours[index] === undefined)
                this.colours[index] = [];

            values.forEach((value, rowValueIndex) => this.colours[index][rowValueIndex] = scale(value));
        });
    }

    resetCellColours() {
        this.$element.find('table.datatable-body tr').each((index, row) => {
            $(row).find('td:gt(0)').each((thIndex, th) => $(th).css('background-color', '#FFFF'));
        });
    }
}
