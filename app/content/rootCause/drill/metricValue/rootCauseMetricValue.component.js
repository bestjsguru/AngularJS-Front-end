'use strict';

import '../metricOverview/rootCauseMetricOverview.component';
import {Config} from '../../../config';

class RootCauseMetricValueCtrl {
    constructor() {
    
    }

    $onInit() {
        this.overviewIsVisible = false;
    }
    
    itemClass() {
        let classList = [];
        
        if(!this.item.isMetric) return classList;
    
        classList.push(this.item.isGood ? 'text-success turquoise' : 'text-danger red');
        
        if(this.item.isDrill) classList.push('bold');
        
        return classList;
    }
    
    percentageStyle() {
        return { width: this.item.percent + '%' };
    }
    
    showMetricOverview(item) {
        if(!Config.isDev) return;
        
        this.overviewIsVisible = true;
    }
    
    hideMetricOverview(item) {
        this.overviewIsVisible = false;
    }
}

truedashApp.component('appRootCauseMetricValue', {
    controller: RootCauseMetricValueCtrl,
    templateUrl: 'content/rootCause/drill/metricValue/rootCauseMetricValue.html',
    bindings: {
        item: '=',
        impacts: '=',
        scroller: '=',
    }
});
