'use strict'

class HorizontalPaginationCtrl {
    constructor() {
        this.currentHorizontalPage = 1;
    }

    setHorizontalPage() {
        this.table.loading = true;
        return this.table.card.metrics.setHorizontalPage(this.currentHorizontalPage)
            .finally(() => {
                this.table.loading = false;
                this.table.init(true);
            });
    }

    previousPage() {
        this.currentHorizontalPage--;
        this.setHorizontalPage();
    }

    nextPage() {
        this.currentHorizontalPage++;
        this.setHorizontalPage();
    }
}

truedashApp.component('tuHorizontalPagination', {
    controller: HorizontalPaginationCtrl,
    templateUrl: 'content/card/datatable/pagination/horizontalPagination.html',
    bindings: {
        table: '='
    }
});
