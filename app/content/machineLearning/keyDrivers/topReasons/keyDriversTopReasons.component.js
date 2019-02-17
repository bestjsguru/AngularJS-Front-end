'use strict';

class KeyDriversTopReasonsCtrl {

    constructor($filter, $rootScope) {
        this.$rootScope = $rootScope;
        this.$filter = $filter;
        
        this.topReasons = [];
    }

    $onInit() {
        this.topReasons = this.data.map(item => ({
            dimension: item.dimension,
            value: item.value,
            actual: this.$filter('value')(item.actual.toFixed(2), {symbol: this.keyDrivers.impacts.actual.symbol}, false),
        }));
    }

    drillDown(item) {
        this.$rootScope.$broadcast('keyDriversWaterfall.point.click', this.keyDrivers.impacts.actual, item.dimension, item.value);
    }
}

truedashApp.component('appKeyDriversTopReasons', {
    controller: KeyDriversTopReasonsCtrl,
    templateUrl: 'content/machineLearning/keyDrivers/topReasons/keyDriversTopReasons.html',
    require: {
        keyDrivers: '^appKeyDrivers'
    },
    bindings: {
        data: '='
    }
});
