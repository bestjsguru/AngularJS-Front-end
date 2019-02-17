'use strict';

import {EventEmitter} from '../system/events.js';
import {Config} from '../config';
import {FrequencySentenceGenerator} from '../common/frequencySentenceGenerator.js';
import {FrequencyParams} from '../common/frequencyParams';
import {AlertParams} from './alertParams';

export class AlertModel extends EventEmitter {
    constructor(data, $injector) {
        super();

        this.Auth = $injector.get('Auth');
        this.$filter = $injector.get('$filter');
        this.CardFactory = $injector.get('CardFactory');
        this.UserService = $injector.get('UserService');
        this.AlertSubscriptionFactory = $injector.get('AlertSubscriptionFactory');

        data = data || {};

        this.id = data.dbo._id;
        this.alertType = AlertParams.getType(data.alertType.name);
        this.alertFrequency = FrequencyParams.getFrequency(data.alertFrequency.value);
        this.alertSubscription = this.convertAlertSubscription(data.alertSubscription);
        this.card = data.card; // This will be overwritten with card object in AlertsCollection.add()
        this.cardId = data.cardId;
        this.cardMetricRelation = data.cardMetricRelation;
        this.cardMetricRelationId = data.cardMetricRelationId;
        this.createUserName = data.createUserName;
        this.customInterval = data.customInterval;
        this.dateTime = data.dateTime;
        this.dbo = data.dbo;
        this.formula = data.formula;
        this.formulaId = data.formulaId;
        this.nextRunTime = data.nextRunTime;
        this.thresholdLimit = data.thresholdLimit;
        this.thresholdValue = data.thresholdValue;
        this.user = this.UserService.create(data.user);

        this.subscription = this.AlertSubscriptionFactory.create(this);
    }

    convertAlertSubscription(data) {
        return (data || []).map(subscription => ({
            id: subscription.id,
            user: this.UserService.create(subscription.user)
        }));
    }

    setData(data) {
        this.alertType = AlertParams.getType(data.alertType);
        this.alertFrequency = FrequencyParams.getFrequency(data.alertFrequency);
        this.cardMetricRelationId = data.cardMetricRelation;
        this.customInterval = data.customInterval;
        this.dateTime = data.dateTime;
        this.formulaId = data.formula;
        this.thresholdLimit = data.thresholdLimit;
        this.thresholdValue = data.thresholdValue;
    }

    getData() {
        return {
            id: this.id,
            alertType: this.alertType.value,
            alertFrequency: this.alertFrequency.value,
            cardMetricRelation: this.cardMetricRelationId,
            createUserName: this.createUserName,
            customInterval: this.customInterval,
            dateTime: this.dateTime,
            formula: this.formulaId,
            thresholdLimit: this.thresholdLimit,
            thresholdValue: this.thresholdValue
        };
    }

    subscribedUsers() {
        return this.alertSubscription.map(subscription => subscription.user);
    }

    formatAlertHeading() {

        let metric, unitInfo;

        if(this.card || this.metric) {
            metric = this.metric || this.card.getMetricFromAlert(this);

            unitInfo = metric && (metric.getUnitInfo() || metric.getYAxisInfo());
            unitInfo = unitInfo && this.$filter('format')(this.thresholdLimit, unitInfo);
        }

        return this.alertType.display(
            this.alertFrequency.verb,
            metric ? metric.label : "Undefined",
            unitInfo ? unitInfo : this.thresholdLimit
        );
    }

    getFrequencySentence() {
        let data = this.getData();
        data.sentenceStart = '';

        let generator = new FrequencySentenceGenerator(data, Config.dateFormats.full);
        return generator.get();
    }

    isOwnAlert() {
        return this.Auth.isLoggedIn() && this.createUserName === this.Auth.user.username;
    }
}
