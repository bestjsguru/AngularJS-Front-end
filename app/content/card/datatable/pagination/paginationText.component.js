'use strict';

class PaginationTextCtrl {
    constructor(DeregisterService, $scope) {
        var watchers = DeregisterService.create($scope);
        watchers.watch('currentPage', () => this.refreshResults());
        this.refreshResults();
    }

    refreshResults(){
        this.results = {
            from: this.calculateFrom(),
            to: this.calculateTo(),
            total: this.totalItems
        };
    }

    calculateFrom(){
        if(this.currentPage == 1 || this.currentPage === undefined) return 1;
        return this.perPage * (this.currentPage - 1) + 1;
    }

    calculateTo(){
        var tmpFrom = this.calculateFrom() + (this.perPage - 1);
        return tmpFrom > this.totalItems ? this.totalItems : tmpFrom;
    }
}

truedashApp.component('tuPaginationText', {
    templateUrl: 'content/card/datatable/pagination/paginationText.html',
    bindings: {
        totalItems: '=',
        perPage: '=',
        currentPage: '='
    },
    controller: PaginationTextCtrl
});
