'use strict';

import './apiai/apiai.service';
import ApiaiController from './apiai/apiai.controller';

class SentenceBuilderController extends ApiaiController {
    constructor($scope, ApiaiService, DeregisterService, MetricService, $state) {
        super($scope, ApiaiService, DeregisterService, MetricService, $state);
    }
}

truedashApp.component('appSentenceBuilder', {
    controller: SentenceBuilderController,
    templateUrl: 'content/sentenceBuilder/sentenceBuilder.html',
    bindings: {
        close: '&',
        dismiss: '&'
    }
});
