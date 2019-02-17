'use strict';

import './rootCauseWaterfallWrapper.service';
import {Config} from '../../config';

class RootCauseWaterfallCtrl {

    constructor($window, $element, $scope, RootCauseWaterfallWrapperService, DeregisterService) {
        this.$window = $window;
        this.$element = $element;
        this.DeregisterService = DeregisterService;
        this.RootCauseWaterfallWrapperService = RootCauseWaterfallWrapperService;

        this.initited = false;

        this.watchers = this.DeregisterService.create($scope);
    }

    get chartWidth() {
        let container = this.$element.closest('.chart-container');
        if (!container.length) container = this.$element.parent();
        return container.width();
    }

    $onInit() {
        this.breakColumns = this.breakByDefault();

        angular.element(this.$window).bind('resize', _.debounce(() => this.fitToCard(), Config.animationSpeed));

        this.watchers.watchCollection('$ctrl.impacts', () => this.initiate());
        this.watchers.watch('$ctrl.breakColumns', () => this.initiate());

        this.watchers.watch('$ctrl.chartWidth', (newWidth, oldWidth) => {
            if(newWidth && oldWidth === 0 || newWidth && !this.initited) {
                this.initiate();
            }
        });
    }

    initiate() {
        let options = {
            impacts: this.impacts,
            breakColumns: this.breakColumns,
            element: this.$element.find('.highchart')[0]
        };

        this.chart = this.RootCauseWaterfallWrapperService.create(options);

        this.initited = true;
    }

    breakByDefault() {
        if(this.$window.isDemo) return false;
        
        return this.impacts.goal.value.previous > 0 && this.impacts.goal.value.current > 0;
    }

    fitToCard() {
        this.watchers.timeout(() => {
            !_.isEmpty(this.chart) && this.chart.reflow();
        }, Config.animationSpeed);
    }

    toggleColumnBreak() {
        this.breakColumns = !this.breakColumns;
    }
}

truedashApp.component('appRootCauseWaterfall', {
    controller: RootCauseWaterfallCtrl,
    template: `
                <div class="highchart"></div>
                <button class="btn btn-eighth btn-xs toggle-column-break" ng-click="$ctrl.toggleColumnBreak()">
                    <i class="fa" ng-class="{'fa-toggle-on': $ctrl.breakColumns, 'fa-toggle-off': !$ctrl.breakColumns}"></i>
                    Column breaks
                </button>
    `,
    bindings: {
        impacts: '='
    }
});
