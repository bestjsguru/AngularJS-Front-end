'use strict';

export default class ColumnValueController {

    sortValues(values) {
        // put selected values first then sort by value
        values.sort((a, b) => {
            if (this.isSelected(a) && this.isSelected(b) || !this.isSelected(a) && !this.isSelected(b)) {
                if(!isNaN(a) && !isNaN(b)) return a - b;
            
                return a.localeCompare(b);
            }
            if (this.isSelected(a) && !this.isSelected(b)) return -1;
            return 1;
        });
    }
    
    isSelected(value) {
        return this.multiple ? this.selected.includes(value) : this.selected === value;
    }
    
    toggle(value) {
        if(this.isSelected(value)) {
            this.selected = this.multiple ? this.selected.filter(item => item !== value) : value;
        } else {
            this.multiple ? this.selected.push(value) : this.selected = value;
        }
    }
    
    selectedValuesArray() {
        return this.multiple ? this.selected : [this.selected];
    }
}
