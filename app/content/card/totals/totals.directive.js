'use strict';

import {Helpers} from '../../common/helpers';

class TotalsController {
    
    constructor($filter) {
        this.$filter = $filter;
        this.formatInfo = {};
        this.metric = {};
    }
    
    $onInit() {
        this.card.metrics.on('loaded', this.updateTotals, this);
    }

    getChangeRate() {
        if (!this.card.getPrevTotal()) return 0;
        return this.card.getTotal() / this.card.getPrevTotal() * 100 - 100;
    }

    updateTotals() {
        let metric = this.card.metrics.getByCompareId(this.card.selectedTotals[0]) || this.card.metrics.getByRelationId(this.card.selectedTotals[0]) || this.card.metrics.getByVirtualId(this.card.selectedTotals[0]);
        if (metric) {
            this.formatInfo = metric.getFormattingInfo();
            this.metric = metric;
        } else {
            this.formatInfo = {};
            this.metric = {};
        }
    }

    getChangeDirection() {
        return Helpers.round(this.getChangeRate(), 0);
    }

    absCeilChangeRate() {
        return Math.abs(Math.ceil(this.getChangeRate()));
    }
    
    tooltipValue() {
        let prevTotal = this.$filter('value')(this.card.getPrevTotal(), this.formatInfo, false, false, this.metric.numberOfDecimals);
        
        return `Compared to previous value which was <strong>${prevTotal}</strong>`;
    }
    
    totalValue() {
        return this.$filter('value')(this.card.getTotal(), this.formatInfo, false, false, this.metric.numberOfDecimals);
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }
}

truedashApp.directive('tuCardTotals', (DeregisterService) => {
    return {
        restrict: 'E',
        controller: TotalsController,
        bindToController: true,
        controllerAs: 'vm',
        scope: {
            card: '='
        },
        template: `
        <div class="card-totals" ng-if="vm.card.selectedTotals.length">
            <div class="total-value" ng-bind="vm.totalValue()"></div>
            <div class="grow-icon" ng-class="{up:vm.getChangeDirection()>0, down:vm.getChangeDirection()<0}"
                tu-popover tu-popover-title="Difference" tu-popover-html="{{vm.tooltipValue()}}" tu-popover-placement="right">
                <i class="fa fa-fw" ng-class="{
                    'fa-angle-up':vm.getChangeDirection()>0,
                    'fa-angle-down':vm.getChangeDirection()<0,
                    'fa-minus':vm.getChangeDirection()==0
                    }"></i><span ng-bind-html="vm.absCeilChangeRate() + '%'"></span>
            </div>
        </div>
        `,
        link: (scope) => {
            var watchers = DeregisterService.create(scope);
            watchers.watchCollection('vm.card.selectedTotals', () => {
                scope.vm.updateTotals();
            });
        }
    };
});
