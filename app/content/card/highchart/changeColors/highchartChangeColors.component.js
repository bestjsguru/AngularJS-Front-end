'use strict';

class HighchartChangeColorsController {
    constructor(CacheService, $rootScope) {
        this.CacheService = CacheService;
        this.$rootScope = $rootScope;

        this.setColors();
    }

    save() {
        // Don't submit if form is invalid
        if (this.form.$invalid) return;

        this.CacheService.put('highchart.colors', this.colors.replaceAll([' ', '\r', '\n'], '').split(','));

        this.$rootScope.$broadcast('highchart.colors.change');

        this.dismiss();
    }

    reset() {
        this.CacheService.remove('highchart.colors');

        this.setColors();
    }

    setColors() {
        let dashboardColors = window.dashboard && window.dashboard.theme.useCustomTheme && window.dashboard.theme.colors.chart;
        
        this.colors = this.CacheService.get('highchart.colors', dashboardColors || window.Auth.user.organisation.theme.colors.chart);
        this.colors = JSON.stringify(this.colors).replaceAll(['[', ']', '"'], '');
    }
}

truedashApp.component('appHighchartChangeColors', {
    controller: HighchartChangeColorsController,
    templateUrl: 'content/card/highchart/changeColors/changeColors.html',
    bindings: {
        close: '&',
        dismiss: '&'
    }
});
