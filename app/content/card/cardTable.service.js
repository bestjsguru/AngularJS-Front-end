'use strict';

class CardTable {
    constructor() {
        this.sortingColumn = { order: undefined, direction: 'asc' };
    }

    getSortingParams() {
        if (this.sortingColumn.order === undefined || this.sortingColumn.direction === undefined) return '';
        return {
            sortField: this.getSortingColumnName(),
            sortDirection: this.getSortingDirection()
        };
    }

    setSortingColumnIndex(index) {
        this.sortingColumn.order = index;
    }

    getSortingColumnIndex() {
        return this.sortingColumn.order;
    }

    getSortingColumnName() {
        return 'f' + this.sortingColumn.order;
    }

    setSortingDirection(direction) {
        this.sortingColumn.direction = direction;
    }

    toggleSortingDirection() {
        this.setSortingDirection(this.getSortingDirection() == 'asc' ? 'desc' : 'asc');
    }

     getSortingDirection() {
        return this.sortingColumn.direction;
    }
}

truedashApp.factory('CardTableFactory', () => {
    return {
        create: () => new CardTable()
    };
});
