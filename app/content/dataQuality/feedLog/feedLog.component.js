'use strict';

class FeedLogController {

    $onInit() {
        this.feed = this.resolve.feed;
    }
}

truedashApp.component('appFeedLog', {
    controller: FeedLogController,
    templateUrl: 'content/dataQuality/feedLog/feedLog.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
