'use strict';

import ColorPickerConfig from '../../../common/colorPicker/colorPickerConfig';

export class EditMetricForm {
    constructor($scope, DeregisterService) {
        this.$scope = $scope;
        this.DeregisterService = DeregisterService;
        this.ColorPickerConfig = new ColorPickerConfig();

        this.visible = false;
    }

    checkEvents(event) {
        if(event.keyCode === 13) this.update();
        if(event.keyCode === 27) this.close();
    }

    $onInit() {
        this.card = this.cardBuilder.card;

        this.data = {
            name: this.metric.label,
            color: this.metric.color || null
        };

        this.watchers = this.DeregisterService.create(this.$scope);
        this.watchers.onRoot('cardBuilderMetrics.editMetric', (event, metric) => {
            if(metric && metric.id === this.metric.id) this.open();
        });
    }

    removeColor() {
        this.data.color = null;
    }

    update() {
        if(!this.data.name) return;

        this.card.metrics.updateMetric(this.metric, this.data);
        this.close();
    }

    open() {
        this.visible = true;
    }

    close() {
        this.visible = false;
        this.data = {
            name: this.metric.label,
            color: this.metric.color || null
        };
    }
}

truedashApp.component('appEditMetricForm', {
    bindings: {
        metric: '='
    },
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: EditMetricForm,
    templateUrl: 'content/builder/metrics/editMetric/editMetricForm.html'
});
