'use strict';

import './regularFormatting.service';
import ColorPickerConfig from '../../../common/colorPicker/colorPickerConfig';
import {ColumnEntityModel} from '../../../card/model/columnEntity.model';

class RegularFormattingCtrl {
    constructor($rootScope, $scope, toaster, $q, DeregisterService, RegularFormattingService) {
        this.$q = $q;
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.RegularFormattingService = RegularFormattingService;
        this.watchers = DeregisterService.create($scope);
        
        this.reorderOptions = {
            stop: (e, ui) => {
                this.updateRegularFormatting();
            },
            items: '> .single-formatting',
            handle: '> .reorder-icon',
        };
    
        this.ColorPickerConfig = new ColorPickerConfig();
    }

    $onInit() {
        this.columns = [];
        this.loading = true;
        this.card = this.cardBuilder.card;
        this.decimals = this.RegularFormattingService.getDecimals();
        
        this.card.metrics.getLoadDataPromise().then(() => {
            return this.initRegularFormatting();
        }).finally(() => {
            this.loading = false;
    
            this.card.metrics.on('added clear removed loaded', this.initRegularFormatting, this);
            this.card.groupings.on('added updated removed', this.initRegularFormatting, this);
        });
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.groupings.off(null, null, this);
    }
    
    initRegularFormatting() {
        this.columns = this.card.groupings.map(item => {
            return {
                id: item.column.id,
                name: item.column.name,
                label: item.getLabel(),
                columnType: item.column.type,
                type: 'dimension',
                hidden: false,
            };
        });
        
        this.columns = [...this.columns, ...this.card.metrics.items.map(item => {
            let isTime = _.get(item.getFormattingInfo(), 'type') === 'time';
            
            return {
                id: this.card.metrics.getMetricId(item),
                name: item.label,
                label: item.label,
                columnType: isTime ? 'time' : 'decimal',
                type: this.card.metrics.getMetricType(item),
                hidden: item.isHidden(),
            };
        })];
    
        this.removeMissingItems();
        this.convertToObjects();
    }
    
    updateRegularFormatting() {
        this.watchers.timeout(() => this.card.formatting.trigger('updated'));
    }
    
    onSelectColumn(item) {
        item.operators = this.getColumnOperators(item.column);
        item.operator = item.operators.find(operator => operator.value === item.operator.value) || item.operators[0];
        
        this.updateRegularFormatting();
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
    
    convertToObjects() {
        this.card.formatting.items = this.card.formatting.getJson().map(item => {
            item.columns = item.columns.map(item => {
                return this.columns.find(column => column.id === item.id && column.type === item.type);
            });
            item.decimals = this.decimals.find(decimal => decimal.value === item.decimals) || this.decimals[0];
            item.operators = this.getColumnOperators(item);
            item.operator = item.operators.find(operator => operator.value === item.operator) || item.operators[0];
            
            return item;
        });
    }
    
    removeMissingItems() {
        this.card.formatting.items = this.card.formatting.getJson().filter(item => {
            item.columns = item.columns.filter(item => {
                // TODO: We need to check by id and type but only after Wasi makes BE change
                return this.columns.find(column => column.id === item.id && column.type === item.type);
            });
            
            return item.columns.length > 0;
        });
    }
    
    addNewItem(type) {
        let item = {
            columns: [this.columns[0]],
            type: type,
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
    
        this.updateRegularFormatting();
    }
    
    removeTextColor(item) {
        item.textColor = false;
    
        this.updateRegularFormatting();
    }
    
    remove(index) {
        this.watchers.timeout(() => {
            this.card.formatting.items.splice(index, 1);
    
            this.updateRegularFormatting();
        });
    }
    
    isBetween(item) {
        return item.operator.value === 'between';
    }
    
    showValues(item) {
        return !['default', 'aa', 'ba'].includes(item.operator.value);
    }
    
    getColumnOperators(item) {
        let operators = this.RegularFormattingService.getOperators();
        
        if(item.type === 'row') {
            operators = operators.filter(operator => operator.value !== 'default');
        }
        
        return operators;
    }
    
    toggleShortNumbers(item) {
        item.useShortNumbers = !item.useShortNumbers;
    
        this.updateRegularFormatting();
    }
    
    toggleCommaSeparator(item) {
        item.commaSeparator = !item.commaSeparator;
    
        this.updateRegularFormatting();
    }
    
    setAlignment(item, align = 'left') {
        item.align = align;
        
        this.updateRegularFormatting();
    }
}

truedashApp.component('appRegularFormatting', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: RegularFormattingCtrl,
    templateUrl: 'content/builder/formatting/regular/regularFormatting.html'
});
