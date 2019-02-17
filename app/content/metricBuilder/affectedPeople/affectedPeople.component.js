'use strict';

export class AffectedPeopleCtrl {
    constructor() {

    }

    $onInit() {
        this.metricBuilder = this.parent;
        this.metricBuilder.affectedPeople = this;
    }
}

truedashApp.component('tuAffectedPeople', {
    controller: AffectedPeopleCtrl,
    templateUrl: 'content/metricBuilder/affectedPeople/affectedPeople.html',
    restrict: 'E',
    require: {
        parent: '^tuMetricBuilder'
    }
});
