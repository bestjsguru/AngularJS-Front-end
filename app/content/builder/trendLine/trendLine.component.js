'use strict';

class TrendLineController {
    $onInit() {
        this.card = this.resolve.card;
        this.showTrendLine = _.clone(this.card.showTrendLine);
        this.extendTrendLine = _.clone(this.card.extendTrendLine);
        
        // For all cards that have trend line enabled from previous implementation
        // but don't have this new extend property set we leave 20% as default
        if(isNull(this.extendTrendLine)) {
            this.extendTrendLine = '20%';
        }
    }
    
    get frequency() {
        switch(this.card.frequencies.selected.toLowerCase()) {
            case 'hourly':
                return 'hours';
            case 'daily':
                return 'days';
            case 'weekly':
                return 'weeks';
            case 'monthly':
                return 'months';
            case 'yearly':
                return 'years';
            default:
                return 'data points';
        }
    }
    
    save() {
        this.card.showTrendLine = this.showTrendLine;
        this.card.extendTrendLine = this.extendTrendLine || 0;
        this.card.trigger('trendLineChange');
        this.dismiss();
    }
    
    toggleTrendLine() {
        this.showTrendLine = !this.showTrendLine;
    }
}

truedashApp.component('appTrendLine', {
    controller: TrendLineController,
    templateUrl: 'content/builder/trendLine/trendLine.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
