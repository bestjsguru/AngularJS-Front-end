'use strict';

import './columnValueDropdown.service';
import './modal/columnValueDropdownModal.component';
import ColumnValueController from './columnValue.controller';

class ColumnValueDropdownController extends ColumnValueController {
    constructor($uibModal, DeregisterService, $scope, DataProvider, ColumnValueDropdownService) {
        super();
        
        this.$uibModal = $uibModal;
        this.DataProvider = DataProvider;
        this.ColumnValueDropdownService = ColumnValueDropdownService;
    
        this.isOpen = false;
        this.hasError = false;
        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        this.model.$render = () => {
            this.selected = this.model.$viewValue;
    
            this.initValues().then(() => {
                this.values = _.compact(_.uniq([...this.values, ...this.selectedValuesArray()]));
            }).then(() => {
                this.sortValues(this.values);
            });
        };
    
        // When we have multi select we have to change tha way how validator is detecting empty values
        if (this.model && this.multiple) {
            this.model.$isEmpty = (value) => {
                return !value || value.length === 0;
            }
        }
        
        // Make sure that we always have array in case of multiselect
        this.watchers.watchCollection('$ctrl.selected', (selected, oldValue) => {
            if(this.multiple && !_.isArray(selected)) {
                this.selected = _.compact([selected]);
            }
    
            // Trigger on change event with every change
            if(!_.isEqual(selected, oldValue)) {
                this.onChange && this.onChange();
                
                this.validate();
            }
        });
        
        // Trigger validation every time dropdown is closed
        this.watchers.watch('$ctrl.isOpen', (isOpen, wasOpen) => !isOpen && wasOpen && this.validate());
        
        // Trigger validation when $dirty property is changed. This will be
        // changed from parent directive in order to trigger validation
        this.watchers.watch('$ctrl.model.$dirty', dirty => dirty && this.validate());
    }
    
    validate() {
        let value = this.selected;
        
        // Only validate if required property exists
        if(this.required !== undefined) {
            if (!this.selected || !this.selected.length) {
                value = undefined;
                this.hasError = true;
            } else {
                this.hasError = false;
            }
            
            this.model.$setValidity("required", !this.hasError);
        }
    
        this.model.$setViewValue(value);
    }
    
    initValues() {
        this.loading = true;
        
        return this.ColumnValueDropdownService.loadValues(this.column).then((values) => {
            this.values = values.slice(0, 10);
        }).finally(() => {
            this.loading = false;
        });
    }
    
    placeholderText() {
        if(this.loading) return 'Loading...';
        
        if(this.selected && this.selected.length) {
            if(!this.multiple) return this.selected;
            
            if(this.selected.length === 1) return this.selected[0];
    
            return this.selected.length + ' values selected';
        }
        
        return this.placeholder || (this.multiple ? 'Select values' : 'Select value');
    }
    
    showMore() {
        this.isOpen = false;
        
        this.$uibModal.open({
            size: 'md',
            component: 'appColumnValueDropdownModal',
            bindToController: true,
            resolve: {
                selected: () => this.selected,
                multiple: () => this.multiple,
                column: () => this.column,
            }
        }).result.then((response) => {
            this.selected = response.selected;
            
            this.values = _.uniq([...this.values, ...this.selectedValuesArray()]);
        }).then(() => {
            this.sortValues(this.values);
            this.validate();
        });
    }
}

truedashApp.component('appColumnValueDropdown', {
    controller: ColumnValueDropdownController,
    templateUrl: 'content/columnValueDropdown/columnValueDropdown.html',
    bindToController: true,
    require: {
        model: "ngModel"
    },
    bindings: {
        column: '=',
        multiple: '@?',
        required: '@?',
        isDisabled: '=?',
        placeholder: '@?',
        onChange: '&?',
    }
});
