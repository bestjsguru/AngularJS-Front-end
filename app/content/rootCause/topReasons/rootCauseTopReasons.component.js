'use strict';

class RootCauseTopReasonsCtrl {

    constructor($filter, $rootScope) {
        this.$rootScope = $rootScope;
        this.$filter = $filter;
        
        this.topReasons = [];
    }

    $onInit() {
        this.topReasons = this.data;
    }

    drillDown(item) {
        this.$rootScope.$broadcast('rootCauseWaterfall.point.click', this.rootCause.impacts.goal, item.dimension, item.value);
    }
}

truedashApp.component('appRootCauseTopReasons', {
    controller: RootCauseTopReasonsCtrl,
    templateUrl: 'content/rootCause/topReasons/rootCauseTopReasons.html',
    require: {
        rootCause: '^appRootCause'
    },
    bindings: {
        data: '='
    }
});
