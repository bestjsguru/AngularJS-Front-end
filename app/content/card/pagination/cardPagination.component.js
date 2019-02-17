'use strict';

class CardPaginationController {
    constructor($q, $state, $element, toaster) {

        this.$q = $q;
        this.$state = $state;
        this.toaster = toaster;
        this.$element = $element;

        if (window.Location.isPhantom) {
            this.$element.hide();

            return;
        }

        this.total = 0;
        this.perPage = 20;
        this.owner = false;

        // Set default because this is going to be set only inside table directives
        // This will contain datatable controller object as we will need some of methods for pagination to work
        if(this.table === undefined) this.table = false;
    }

    $onInit() {
        if(['table'].includes(this.card.types.get())) {
            // This will trigger every time metrics are loaded, and that will mean that page has changed
            this.card.metrics.on('loaded', () => this.onMetricsLoad(), this);
            this.card.frequencies.on('updated', () => this.onFrequencyChange(), this);
        }

        // We don't need to show card owner on card builder page
        if(this.tuExplore) {
            // Load owner details
            this.$q.when(this.card.loadOwner()).then(() => {
                this.owner = this.card.getOwner();
            });
        }

        this.onMetricsLoad();
    }

    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.frequencies.off(null, null, this);
    }

    getRowTotal() {
        try {
            return this.card.metrics.originalData.rowCount;
        } catch (e) {
            console.error(`Couldn't get row total for a card ${this.card.id}.`, e);
        }
    
        return this.total;
    }
    
    isOnePageOnly() {
        if (!this.total) return true;
        
        return this.table.currentPage === 1 && this.total <= this.perPage;
    }

    onFrequencyChange() {
        // We need to refresh page counter when frequency changes
        this.table.currentPage = 1;
    }

    onMetricsLoad() {
        this.total = this.getRowTotal();
        this.perPage = this.card.metrics.originalData.total;
    }

    showPagination() {
        return this.table && this.table.card.cardTable && !this.isOnePageOnly() && !this.table.isLoading();
    }
}

truedashApp.component('appCardPagination', {
    controller: CardPaginationController,
    templateUrl: 'content/card/pagination/cardPagination.html',
    bindings: {
        card: '=',
        table: '=?'
    },
    require: {
        tuExplore: '^?tuExplore',
    }
});
