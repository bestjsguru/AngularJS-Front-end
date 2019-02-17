'use strict';

import {Helpers} from '../../../../common/helpers';

class RootCauseMetricOverviewDetailsCtrl {
    constructor($filter) {
        this.$filter = $filter;
    }

    $onInit() {
        this.item = this.resolve.item;
        this.impacts = this.resolve.impacts.items.map(impact => {
            impact.data = this.getImpactValue(impact);
            
            return impact;
        });
    }
    
    isActive(item) {
        return item.metric.id === this.item.metric.id;
    }
    
    getLetter(index) {
        return index >= 0 ? Helpers.alphabet[index] : '';
    }
    
    getImpactClass(impact) {
        return {
            'bold': this.item.goal,
            'text-success': impact.impactIsGood,
            'text-danger': !impact.impactIsGood,
        };
    }
    
    getImpactPercentClass(impact) {
        return {
            'bold': this.item.goal,
            'fa-arrow-up': impact.isIncrease,
            'fa-arrow-down': !impact.isIncrease,
            'text-success': impact.impactIsGood,
            'text-danger': !impact.impactIsGood,
        };
    }
    
    getImpactValue(impact) {
        let valueObject = {
            value: impact.drillDown.diff[this.item.index],
            before: impact.drillDown.before[this.item.index],
            after: impact.drillDown.after[this.item.index],
        };
        
        valueObject.percent = parseInt((valueObject.after - valueObject.before) / valueObject.before * 100);
        valueObject.formattedValue = this.$filter('value')(valueObject.value, {symbol: impact.symbol}, false, true);
        valueObject.formattedBefore = this.$filter('value')(valueObject.before, {symbol: impact.symbol}, false, false);
        valueObject.formattedAfter = this.$filter('value')(valueObject.after, {symbol: impact.symbol}, false, false);
        
        return valueObject;
    }
}

truedashApp.component('appRootCauseMetricOverviewDetails', {
    controller: RootCauseMetricOverviewDetailsCtrl,
    templateUrl: 'content/rootCause/drill/metricOverview/details/rootCauseMetricOverviewDetails.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
