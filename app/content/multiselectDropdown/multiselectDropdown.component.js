'use strict';

class MultiselectDropdownController {
    constructor($uibModal, DeregisterService, $scope, DataProvider) {
        this.$uibModal = $uibModal;
        this.DataProvider = DataProvider;
    
        this.isOpen = false;
        this.hasError = false;
        this.watchers = DeregisterService.create($scope);
    }

    $onInit() {
        this.model.$render = () => {
            this.selected = this.model.$viewValue;
    
            this.options = _.compact(_.uniq([...this.options, ...this.selectedValuesArray()]));
            this.multiple && this.sortValues();
        };
    
        // When we have multi select we have to change tha way how validator is detecting empty values
        if (this.model && this.multiple) {
            this.model.$isEmpty = (value) => {
                return !value || value.length === 0;
            };
        }
        
        // Make sure that we always have array in case of multiselect
        this.watchers.watchCollection('$ctrl.selected', (selected, oldValue) => {
            if(!_.isArray(selected)) {
                this.selected = _.compact([selected]);
            }
    
            // Trigger on change event with every change
            if(!_.isEqual(selected, oldValue)) {
                this.onChange && this.onChange();
            }
            
            // Trigger validation if original value is changed outside of dropdown
            if(!this.isOpen) this.validate();
        });
        
        // Trigger validation every time dropdown is closed
        this.watchers.watch('$ctrl.isOpen', (isOpen, wasOpen) => {
            // On close
            if(!isOpen && wasOpen) {
                this.validate();
                this.query = '';
            }
    
            // Sort values when opened and is multi select
            isOpen && !wasOpen && this.multiple && this.sortValues();
        });
        
        // Trigger validation when $dirty property is changed. This will be
        // changed from parent directive in order to trigger validation
        this.watchers.watch('$ctrl.model.$dirty', dirty => dirty && this.validate());
    }
    
    sortValues() {
        // We don't want to sort values yet. If we wanted to put selected values on top this is where we would do it.
    }
    
    isSelected(value) {
        return this.multiple ? this.selected.includes(value) : this.selected.includes(value);
    }
    
    toggle(value) {
        if(this.isSelected(value)) {
            let index = this.selected.findIndex(item => item === value);
            
            if(this.multiple) {
                if(this.required && this.selected.length === 1) return;
    
                this.selected.splice(index, 1);
            } else {
                this.selected = [value];
            }
            
        } else {
            this.multiple ? this.selected.push(value) : this.selected = [value];
        }
    }
    
    selectedValuesArray() {
        return this.multiple ? this.selected : this.selected;
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
    
        if(!_.isArray(value)) value = _.compact([value]);
    
        this.model.$setViewValue(value);
    }
    
    placeholderText() {
        if(this.loading) return 'Loading...';
        
        if(this.selected && this.selected.length) {
            if(!this.multiple) return this.selected[0][this.valueLabel];
            
            if(this.selected.length <= (this.displayCount || 1)) return this.selected.map(item => item[this.valueLabel]).join(', ');
    
            return this.selected.length + ' items selected';
        }
        
        return this.placeholder || (this.multiple ? 'Select items' : 'Select item');
    }
    
    preventClose($event) {
        $event.stopPropagation();
        $event.preventDefault();
    }
    
    selectAll() {
        if(this.multiple) {
            this.options.forEach(value => {
                if(!this.isSelected(value)) this.selected.push(value);
            });
        }
    }
    
    unselectAll() {
        if(this.multiple) this.selected = [];
    }
    
    get filterProperties() {
        let properties = this.valueLabel;
        
        if(this.valueSubtitle) {
            properties += ', ' + this.valueSubtitle;
        }
        
        return properties;
    }
}

truedashApp.component('appMultiselectDropdown', {
    controller: MultiselectDropdownController,
    templateUrl: 'content/multiselectDropdown/multiselectDropdown.html',
    bindToController: true,
    require: {
        model: "ngModel"
    },
    bindings: {
        options: '<',
        multiple: '@?',
        required: '@?',
        isDisabled: '=?',
        placeholder: '@?',
        valueLabel: '@',
        valueSubtitle: '@?',
        displayCount: '@?',
        searchEnabled: '=?',
        showSelectActions: '=?',
        onChange: '&?',
    }
});
