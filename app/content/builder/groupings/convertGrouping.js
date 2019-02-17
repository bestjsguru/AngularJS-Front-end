'use strict';

export default class ConvertGrouping {

    toText(grouping) {
        let value = this.parseValue(grouping);

        let text = `<span class="group text-capitalize">${grouping.column.getLabel()}</span> ${value}`;

        if(grouping.applyGroupByNull) text += ' including nulls';

        return text;
    }

    parseValue(grouping) {

        if(!grouping.values) return '';

        let value = grouping.values.join(', ');

        if(grouping.values.length > 1) value = `[${value}]`;

        return value;
    }
}
