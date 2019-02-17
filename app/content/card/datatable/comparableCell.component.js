import {Helpers} from '../../common/helpers';
'use strict';

class ComparableCellCtrl {
    
    constructor($filter) {
        this.$filter = $filter;
    }
    
    $onInit() {
        this.value = _.cloneDeep(this.data);
        
        this.card.formatting.on('updated', () => {
            this.applyFormatting();
        }, this);
    
        this.applyFormatting();
    }
    
    applyFormatting() {
        if(this.rowIndex < 0 || this.columnIndex < 0) return;
        
        this.formatting = this.card.formatting.check(this.data.comparableFormatted, this.columnsData, this.results, this.columnIndex, this.rowIndex);
        
        if(!this.formatting) return;
    
        if(this.card.metrics.columnIsNumeric(this.columnIndex)) {
            this.formatComparableValue();
            this.formatDifferenceValue();
        }
    
        this.applyPrefixSuffix();
    }
    
    formatComparableValue() {
        this.value.comparableFormatted = _.clone(this.data.comparableFormatted);
        let number = Helpers.toNumberWithPrefixAndSuffix(this.data.comparableFormatted);
    
        if(!_.isNull(number.value) && !_.isNaN(number.value)) {
            this.value.comparableFormatted = number.value;
            this.value.comparableFormatted = this.$filter('value')(
                this.value.comparableFormatted,
                null,
                this.formatting.useShortNumbers,
                false,
                this.formatting.decimals,
                this.formatting.commaSeparator
            );
        
            this.value.comparableFormatted = [number.prefix, this.value.comparableFormatted, number.suffix].join('');
        }
    }
    
    formatDifferenceValue() {
        this.value.difference = _.clone(this.data.difference);
        let number = Helpers.toNumberWithPrefixAndSuffix(this.data.difference);
    
        if(!_.isNull(number.value) && !_.isNaN(number.value)) {
            this.value.difference = number.value;
            this.value.difference = this.$filter('value')(
                this.value.difference,
                null,
                this.formatting.useShortNumbers,
                false,
                this.formatting.decimals,
                this.formatting.commaSeparator
            );
        
            this.value.difference = [number.prefix, this.value.difference, number.suffix].join('');
        }
    }
    
    applyPrefixSuffix() {
        if(this.formatting.prefix) {
            let differencePosition = this.value.difference.indexOf('-') + 1;
            this.value.difference = [this.value.difference.slice(0, differencePosition), this.formatting.prefix, this.value.difference.slice(differencePosition)].join('');
            
            let comparablePosition = this.value.comparableFormatted.indexOf('-') + 1;
            this.value.comparableFormatted = [this.value.comparableFormatted.slice(0, comparablePosition), this.formatting.prefix, this.value.comparableFormatted.slice(comparablePosition)].join('');
        }
        
        if(this.formatting.suffix) {
            this.value.difference += this.formatting.suffix;
            this.value.comparableFormatted += this.formatting.suffix;
        }
    }

    dataComparableFormatted() {
        return !_.isNaN(this.value.comparableFormatted) ? this.value.comparableFormatted : 0 ;
    }

    dataComparableValue() {
        return !_.isNaN(this.value.comparableValue) ? this.value.comparableValue : 0;
    }

    dataDifference() {
        return !_.isNaN(this.value.difference) ? this.value.difference : 0;
    }
    
    $onDestroy() {
        this.card.formatting.off(null, null, this);
    }
}

truedashApp.component('appComparableCell', {
    controller: ComparableCellCtrl,
    templateUrl: 'content/card/datatable/comparableCell.html',
    bindings: {
        data: '=',
        results: '=',
        rowIndex: '=',
        columnIndex: '=',
        columnsData: '=',
        card: '=',
    }
});
