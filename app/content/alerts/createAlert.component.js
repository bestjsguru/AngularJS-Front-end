import {AlertParams} from './alertParams';
import {FrequencyParams} from '../common/frequencyParams';
import {FrequencyData} from '../common/frequencyData';

class CreateAlertCtrl {
    constructor(toaster) {
        this.toaster = toaster;
    }

    $onInit() {
        this.title = this.resolve.alert ? 'Update alert' : 'Create an alert';
        this.selectedTab = 'type';
        this.conditions = AlertParams.getTypes();
        this.frequencies = FrequencyParams.getAllFrequencies();
        this.customFrequencies = FrequencyParams.getFrequencies();

        this.submitted = false;

        this.selected = {
            metric: this.resolve.card.metrics.get(0),
            alertFrequency: this.frequencies[1], // Set Daily as default
            customAlertFrequency: this.frequencies[1], // Set Daily as default
            customInterval: 1,
            frequencies: this.frequencies,
            customFrequencies: this.customFrequencies
        };

        if (this.resolve.alert) {
            this.selectedAlert = this.resolve.alert;
            this.preselectData(this.resolve.alert, this.resolve.alert.card);
            this.disabledTab = {when: false};

        } else {
            this.disabledTab = {when: true};
        }

        this.serverLoading = false;
    }

    metricsWithoutComparable() {
        return this.resolve.card.metrics.items.filter(item => !item.isComparable());
    }

    nextStep() {
        if (this.form.$invalid) {
            this.submitted = true;
            return;
        }
        this.disabledTab.when = false;
        this.selectedTab = 'when';
    }

    save() {
        let data = this.gatherAlertData(this.selected);
        if (!data.dateTime) return;

        let request, message;
        this.serverLoading = true;

        if(this.selectedAlert) {
            message = "Alert updated";
            request = this.resolve.card.alerts.update(this.selectedAlert, data);
        } else {
            message = "Alert created";
            request = this.resolve.card.alerts.create(data).then((createdAlert) => {
                return createdAlert.subscription.subscribeCurrentUser().then(() => {
                    this.selectedAlert = createdAlert;
                });
            });
        }

        request.then(() => {
            this.toaster.success(message);
            this.dismiss();
        }).catch((e) => {
            console.log(e);
            this.toaster.error('Error occurred, please try again');
        }).finally(() => {
            this.serverLoading = false;
        });
    }

    preselectData(alert, card) {
        this.selected.dateTime = alert.dateTime;
        this.selected.frequency = alert.alertFrequency;
        this.selected.alertType = alert.alertType;

        this.selected.thresholdLimit = alert.thresholdLimit;
        this.selected.thresholdValue = alert.thresholdValue;

        this.selected.metric = card.getMetricFromAlert(alert);

        this.selected.alertFrequency = alert.isCustomInterval ? FrequencyParams.getCustomFrequency() : alert.alertFrequency;
        this.selected.customAlertFrequency = alert.alertFrequency;
        this.selected.customInterval = alert.customInterval;
    }

    gatherAlertData(data) {
        var alertData = FrequencyData.forEmailReport(data);
        alertData.thresholdLimit = data.thresholdLimit;

        data.thresholdValue && (alertData.thresholdValue = data.thresholdValue);

        if (this.resolve.card.isVirtual()) {
            alertData.formula = this.resolve.card.formulas.getRealIdFromVId(alertData.formula);
        }

        return alertData;
    }
}

truedashApp.component('appCreateAlert', {
    controller: CreateAlertCtrl,
    templateUrl: 'content/alerts/createAlert.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
