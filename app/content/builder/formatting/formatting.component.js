'use strict';

import './formatting.service';
import ColorPickerConfig from '../../common/colorPicker/colorPickerConfig';
import {ColumnEntityModel} from '../../card/model/columnEntity.model';
import {ColumnHelper} from '../../card/datatable/column.helper';

class FormattingCtrl {
    constructor($rootScope, $scope, toaster, $q, DeregisterService, FormattingService) {
        this.$q = $q;
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.FormattingService = FormattingService;
        this.watchers = DeregisterService.create($scope);
        
        this.reorderOptions = {
            stop: (e, ui) => {
                this.updateFormatting();
            },
            items: '> .reorder-item',
            handle: '> .reorder-icon',
        };
    
        this.ColorPickerConfig = new ColorPickerConfig();
    }

    $onInit() {
        this.columns = [];
        this.loading = true;
        this.card = this.cardBuilder.card;
        this.metric = this.card.metrics.first();
        this.decimals = this.FormattingService.getDecimals();
        
        this.card.metrics.getLoadDataPromise().then(() => {
            return this.initFormatting();
        }).finally(() => {
            this.loading = false;
    
            this.card.metrics.on('loaded', () => {
                this.initFormatting();
            }, this);
        });
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }
    
    initFormatting() {
        return this.loadColumns().then(() => {
            return this.addExistingItems();
        });
    }
    
    updateFormatting() {
        this.watchers.timeout(() => this.card.formatting.trigger('updated'));
    }
    
    onSelectColumn(item) {
        item.operators = this.getColumnOperators(item.column);
        item.operator = item.operators.find(operator => operator.value === item.operator.value) || item.operators[0];
        
        this.updateFormatting();
    }
    
    onSelectOperator(item) {
        if(!this.isBetween(item)) {
            delete item.valueTo;
        }
        
        if(!this.showValues(item)) {
            delete item.value;
            delete item.valueTo;
        }
    }
    
    onSelectDecimal(item) {
        this.$rootScope.$broadcast('popover.hide');
    }
    
    addExistingItems() {
        this.card.formatting.items = this.card.formatting.getJson().map(item => {
            item.columns = item.columns.map(columnName => {
                return this.columns.find(column => column.name === columnName);
            });
            item.decimals = this.decimals.find(decimal => decimal.value === item.decimals) || this.decimals[0];
            item.operators = this.getColumnOperators(item);
            item.operator = item.operators.find(operator => operator.value === item.operator) || item.operators[0];
            
            return item;
        });
    }
    
    loadColumns() {
        return this.FormattingService.getMetricColumns(this.metric.rawId).then((columns) => {
            this.columns = columns.map(column => {
                column = new ColumnEntityModel(column);
                column.type = 'DECIMAL';
                
                return column;
            });
        });
    }
    
    addNewItem(type) {
        let item = {
            columns: [this.columns[0]],
            type: type,
            columnType: 'decimal',
            decimals: this.decimals[0],
            color: false,
            textColor: false,
            useShortNumbers: false,
            commaSeparator: true,
            align: 'left',
            prefix: '',
            suffix: '',
        };
    
        item.operators = this.getColumnOperators(item);
        item.operator = this.getColumnOperators(item)[0];
        
        this.card.formatting.items.push(item);
    }
    
    removeColor(item) {
        item.color = false;
    
        this.updateFormatting();
    }
    
    removeTextColor(item) {
        item.textColor = false;
    
        this.updateFormatting();
    }
    
    remove(index) {
        this.watchers.timeout(() => {
            this.card.formatting.items.splice(index, 1);
    
            this.updateFormatting();
        });
    }
    
    isBetween(item) {
        return item.operator.value === 'between';
    }
    
    showValues(item) {
        return !['default', 'aa', 'ba'].includes(item.operator.value);
    }
    
    getColumnOperators(item) {
        let operators = this.FormattingService.getOperators();
        
        if(item.type === 'row') {
            operators = operators.filter(operator => operator.value !== 'default');
        }
        
        return operators;
    }
    
    isNumber(item) {
        return ColumnHelper.isNumberType(item.columnType);
    }
    
    setStringValues(item, isString) {
        item.columnType = isString ? 'string' : 'decimal';
        
        this.updateFormatting();
    }
    
    toggleShortNumbers(item) {
        item.useShortNumbers = !item.useShortNumbers;
        
        this.updateFormatting();
    }
    
    toggleCommaSeparator(item) {
        item.commaSeparator = !item.commaSeparator;
        
        this.updateFormatting();
    }
    
    setAlignment(item, align = 'left') {
        item.align = align;
        
        this.updateFormatting();
    }
}

truedashApp.component('appFormatting', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: FormattingCtrl,
    templateUrl: 'content/builder/formatting/formatting.html'
});
