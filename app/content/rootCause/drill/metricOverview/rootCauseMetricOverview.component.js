'use strict';

import {Helpers} from '../../../common/helpers';
import './details/rootCauseMetricOverviewDetails.component';

class RootCauseMetricOverviewCtrl {
    constructor($scope, DeregisterService, $element, $uibModal, $filter) {
        this.$filter = $filter;
        this.$element = $element;
        this.$uibModal = $uibModal;
        this.watchers = DeregisterService.create($scope);
    
        this.loading = false;
    }

    $onInit() {
        this.fitToScreen();
    }
    
    fitToScreen() {
        let parent = this.$element.parents('.drill-metric-value').first();
        
        let position = Helpers.elementOffset(parent[0]);
        
        this.watchers.timeout(() => {
            let dropdownHeight = this.$element.find('.drill-metric-overview').first().outerHeight();

            // We subtract 40px from height as that's how tall is footer and we want to remove footer from calculations
            let canFitDown = position.top + dropdownHeight < window.innerHeight - 40;
            
            if(canFitDown) {
                this.$element.find('.drill-metric-overview').first().css({
                    top: '-7px',
                    right: '100%',
                    display: 'block',
                }).removeClass('display-up');
            } else {
                this.$element.find('.drill-metric-overview').first().css({
                    top: 'auto',
                    bottom: 'calc(100% - ' + (this.$element.parents('.drill-metric-value').first().outerHeight() + 8) + 'px)',
                    right: '100%',
                    display: 'block',
                }).addClass('display-up');
            }
        });
    }
    
    isActive(item) {
        return item.metric.id === this.item.metric.id;
    }
    
    getLetter(index) {
        return index >= 0 ? Helpers.alphabet[index] : '';
    }
    
    showOverview() {
        this.modal && this.modal.dismiss();
        this.modal = this.$uibModal.open({
            component: 'appRootCauseMetricOverviewDetails',
            size: 'lg',
            resolve: {
                item: () => this.item,
                impacts: () => this.impacts,
            }
        });
    }
    
    getImpactClass(impact) {
        return {
            'bold': this.item.goal,
            'text-success': impact.impactIsGood,
            'text-danger': !impact.impactIsGood,
        };
    }
    
    getImpactValue(impact) {
        let value = impact.drillDown.diff[this.item.index];
        
        return {
            value: value,
            formattedValue: this.$filter('value')(value, {symbol: impact.symbol}, false, true),
        };
    }
}

truedashApp.component('appRootCauseMetricOverview', {
    controller: RootCauseMetricOverviewCtrl,
    templateUrl: 'content/rootCause/drill/metricOverview/rootCauseMetricOverview.html',
    bindings: {
        item: '=',
        impacts: '=',
    }
});
