'use strict';

import Tabs from '../../common/tabs';
import ColumnValueController from '../columnValue.controller';
import CodemirrorConfig from '../../common/codemirror/codemirrorConfig';

class ColumnValueDropdownModalController extends ColumnValueController {
    constructor(ColumnValueDropdownService, DeregisterService, $scope) {
        super();
        
        this.ColumnValueDropdownService = ColumnValueDropdownService;
        
        this.query = '';
        this.allValues = [];
        this.loading = false;
        this.watchers = DeregisterService.create($scope);
        this.codemirrorConfig = new CodemirrorConfig();
        this.codemirrorConfig.disableKeywords();
        this.codemirrorConfig.removeHighlighting();
        
        this.tabs = new Tabs(['values', 'raw']);
        this.tabs.activate('values');
        
        this.resetOffset();
    }

    $onInit() {
        this.loading = true;
        
        this.selected = _.clone(this.resolve.selected);
        this.column = this.resolve.column;
        this.multiple = this.resolve.multiple;
        
        !this.multiple && this.codemirrorConfig.convertToInput();
        
        this.ColumnValueDropdownService.loadValues(this.column).then((values) => {
            this.setOffset(values);
            
            this.allValues = _.compact(_.uniq([...values, ...this.selectedValuesArray()]));
        }).then(() => {
            this.sortValues(this.allValues);
    
            this.values = _.clone(this.allValues);
        }).finally(() => {
            this.loading = false;
        });
        
        this.watchers.watch('$ctrl.rawValues', (newValues, oldValues) => {
            if(newValues !== oldValues) {
                if(!this.multiple) {
                    this.selected = newValues;
                } else {
                    this.selected = _.uniq(newValues.split('\n'));
                    this.selected = _.compact(this.selected.map(item => item.trim(' ')));
                }
                
                this.filter();
            }
        });
    }
    
    setOffset(values) {
        this.offset += values.length;
        this.hasMoreValues = values.length === this.ColumnValueDropdownService.limit;
    }
    
    resetOffset() {
        this.offset = 0;
        this.hasMoreValues = true;
    }
    
    apply() {
        this.modalInstance.close({
            selected: this.selected,
        });
    }
    
    filter() {
        this.resetOffset();
        this.loading = true;
        
        this.ColumnValueDropdownService.loadValues(this.column, this.query).then((values) => {
            this.allValues = values;
            this.setOffset(values);
    
            if(!this.query.length) {
                // If nothing is being searched for we return all selected values
                this.allValues = _.compact(_.uniq([...this.allValues, ...this.selectedValuesArray()]));
            }
        }).then(() => {
            this.sortValues(this.allValues);
    
            this.values = _.clone(this.allValues);
        }).finally(() => {
            this.loading = false;
        });
    }
    
    loadMore() {
        this.loading = true;
        
        this.ColumnValueDropdownService.loadValues(this.column, this.query, this.offset).then((values) => {
            this.setOffset(values);
    
            if(!this.query.length) {
                // If nothing is being searched for we return all selected values
                this.allValues = _.compact(_.uniq([...this.allValues, ...values, ...this.selectedValuesArray()]));
            }
        }).then(() => {
            this.sortValues(this.allValues);
    
            this.values = _.clone(this.allValues);
        }).finally(() => {
            this.loading = false;
        });
    }
    
    showRawValues() {
        this.rawValues = this.selectedValuesArray();
        this.sortValues(this.rawValues);
        
        this.rawValues = this.rawValues.join('\n');
        
        this.tabs.activate('raw');
    }
    
    selectAll() {
        this.values.forEach(value => {
            !this.isSelected(value) && this.toggle(value);
        });
    }
    
    selectNone() {
        this.values.forEach(value => {
            this.isSelected(value) && this.toggle(value);
        });
    }
    
}

truedashApp.component('appColumnValueDropdownModal', {
    controller: ColumnValueDropdownModalController,
    templateUrl: 'content/columnValueDropdown/modal/columnValueDropdownModal.html',
    bindings: {
        modalInstance: "<",
        resolve: '<',
    }
});
