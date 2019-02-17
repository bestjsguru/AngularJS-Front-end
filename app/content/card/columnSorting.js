'use strict';

export class ColumnSorting {
    constructor(card) {
        this.sortOrder = [];
        this.card = card;
    }
    
    createColumn(text, direction = 'asc', initialIndex = 0) {
        return {text, direction, initialIndex};
    }

    init() {
        if (!this.sortOrder) this.sortOrder = [];
        // this.card.columnsSort && this.card.columnsSort.forEach(column => this.sortOrder.push(this.initColumn(column.initialIndex, column.direction, false)));
        if (this.card.columnsSort)
            this.sortOrder = angular.copy(this.card.columnsSort);

        this.sortOrder = _.uniq(this.sortOrder, false, (item) => item.text);
    }

    canSort() {
        return this.card.isOwnedByCurrentUser() || this.card.userCanEdit();
    }
    
    set(column) {
        if (_.indexOf(this.sortOrder, column) === 0) {
            if(column.direction == 'desc') {
                // This means that we have clicked 3 times in a row on a same column
                // and in that case we will remove column sort from this column
                this.sortOrder = _.without(this.sortOrder, column);
            } else {
                // When we click two times on a same column we change sorting direction
                column.direction = column.direction == 'asc' ? 'desc' : 'asc';
            }
        } else {
            // When we click on a column first time we make it priority in sorting, so when we are
            // sorting with more than one column last one clicked will take priority
            this.sortOrder = _.without(this.sortOrder, column);
            this.sortOrder.unshift(column);
        }

        this.sortOrder = _.uniq(this.sortOrder, false, (item) => item.text);
        this.card.columnsSort = angular.copy(this.sortOrder);
    }
    
    reset() {
        this.sortOrder = [];
        this.card.columnsSort = [];
    }

    getColumn(index) {
        return _.find(this.sortOrder, {initialIndex: index});
    }

    getColumnIndex(column) {
        var pos = _.indexOf(this.sortOrder, column);
        if (pos < 0) return '';
        return pos + 1;
    }
    
    getState() {
        return {
            sortOrder: _.cloneDeep(this.sortOrder),
            columnsSort: _.cloneDeep(this.card.columnsSort),
        };
    }
    
    setState(state) {
        this.sortOrder = state.sortOrder;
        this.card.columnsSort = state.columnsSort;
    }
}
