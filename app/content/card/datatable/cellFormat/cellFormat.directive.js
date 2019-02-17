'use strict';

class CellFormatController {

    constructor($element) {
        this.$element = $element;
    }

    $onInit() {
        this.applyFormatting();
        
        this.card.formatting.on('updated', () => {
            this.applyFormatting();
        }, this);
    }
    
    applyFormatting() {
        if(this.rowIndex < 0 || this.columnIndex < 0) return;
        
        this.formatting = this.card.formatting.check(this.value, this.columns, this.results, this.columnIndex, this.rowIndex);
    
        this.$element.css(this.formattingStyle());
    }
    
    formattingStyle() {
        return {
            color: _.get(this.formatting, 'textColor') || '',
            background: _.get(this.formatting, 'color') || '',
            'text-align': _.get(this.formatting, 'align') || '',
        }
    }
    
    $onDestroy() {
        this.card.formatting.off(null, null, this);
    }
}

truedashApp.directive('appCellFormat', () => {
    return {
        restrict: 'A',
        controller: CellFormatController,
        scope: true,
        bindToController: {
            value: '<',
            results: '<',
            rowIndex: '<',
            columnIndex: '<',
            columns: '<',
            card: '='
        },
    };
});
