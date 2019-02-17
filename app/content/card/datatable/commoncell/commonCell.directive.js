'use strict';

import {Helpers} from '../../../common/helpers';

class CommonCellController {

    constructor($element, DeregisterService, $scope, $filter) {
        this.$element = $element;
        this.$filter = $filter;
        this.$scope = $scope;
        this.deregisterService = DeregisterService;
        this.init();
    }

    init(){
        this.isValueNumber = false;
        this.watchers = this.deregisterService.create(this.$scope);
        this.watchers.onRoot('datatablePageChanged', () => {
            this.updateDirectiveData();
        });
    }

    $onInit() {
        this.originalData = _.clone(this.data);
    
        if(!this.card.isCustomSQL()) {
            this.updateDirectiveData();
        }
        
        this.card.formatting.on('updated', () => {
            this.applyFormatting();
        }, this);
        
        this.applyFormatting();
    }
    
    applyFormatting() {
        if(this.rowIndex < 0 || this.columnIndex < 0) return;
        
        this.formatting = this.card.formatting.check(this.originalData, this.columnsData, this.results, this.columnIndex, this.rowIndex);
    
        this.data = _.clone(this.originalData);
        
        if(!this.formatting) return;
    
        if(this.card.metrics.columnIsNumeric(this.columnIndex)) {
            let number = Helpers.toNumberWithPrefixAndSuffix(this.originalData);
    
            if(!_.isNull(number.value) && !_.isNaN(number.value)) {
                this.data = number.value;
                this.data = this.$filter('value')(
                    this.data,
                    null,
                    this.formatting.useShortNumbers,
                    false,
                    this.formatting.decimals,
                    this.formatting.commaSeparator
                );
        
                this.data = [number.prefix, this.data, number.suffix].join('');
            }
        }
        
        this.applyPrefixSuffix();
    }

    updateDirectiveData() {
        if (this.columnIndex <= 0) return;
    
        let metric = this.getMetric(this.columnsData[this.columnIndex]);

        if (metric) {
            this.isIncrease = metric.isIncrease;
            this.isColoring = metric.isColoring;

            if (this.isColoring) {
                let valueWithoutSymbols = this.customReplace(this.data);
                this.isValueNumber = !_.isNaN(+valueWithoutSymbols);

                if (this.isValueNumber) {
                    let array = this.results.map(item => +this.customReplace(item[this.columnIndex]));
                    let average = array.reduce((a, b) => a + b) / array.length;
                    this.difference = valueWithoutSymbols - average;

                    this.isGrowing = this.isIncrease ? this.difference > 0 : this.difference < 0;
                }
            }
        }

        this.setCellClass();
    }

    getMetric(name) {
        // If there is only one metric we return immediately
        if(this.card.metrics.length == 1) return this.card.metrics.get(0);

        let metric = this.card.metrics.find(m => m.name === name);

        if (!metric && this.card.formulas.length > 0) {
            let formula = this.card.formulas.find(m => m.data.name.toLowerCase() === String(name).toLowerCase());
            // for card with frequency total and formulas
            metric = formula ? formula.data : null;
            this.isFormula = true;
        }

        return metric;
    }

    customReplace(value) {
        return String(value).replaceAll(['£', '€', '$', '%', ',', '(', ')'], '');
    }

    arrowSymbolClass() {
        if (this.isValueNumber && this.difference !== 0 && this.isColoring) {
            return {'fa-angle-up': this.isGrowing, 'fa-angle-down': !this.isGrowing};
        } else {
            return {};
        }
    }

    setCellClass() {
        let td = angular.element(this.$element).closest('td');

        if (this.isValueNumber && this.difference !== 0 && this.isColoring) {
            if (this.isGrowing) {
                td.removeClass('td-red');
                td.addClass('td-green');
            } else {
                td.removeClass('td-green');
                td.addClass('td-red');
            }
        } else {
            td.removeClass('td-green');
            td.removeClass('td-red');
        }
    }
    
    applyPrefixSuffix() {
        if(this.formatting.prefix) {
            let position = this.data.indexOf('-') + 1;
            
            this.data = [this.data.slice(0, position), this.formatting.prefix, this.data.slice(position)].join('');
        }
        
        if(this.formatting.suffix) {
            this.data += this.formatting.suffix;
        }
    }
    
    $onDestroy() {
        this.card.formatting.off(null, null, this);
    }
}

truedashApp.component('tuCommonCell', {
    controller: CommonCellController,
    templateUrl: 'content/card/datatable/commoncell/commonCell.html',
    bindings: {
        data: '=',
        results: '=',
        rowIndex: '=',
        columnIndex: '=',
        columnsData: '=',
        card: '='
    }
});
