'use strict';

import '../../anomalyDetection/singleAnomaly/singleAnomaly.component';
import '../../anomalyDetection/cardAnomalies';
import '../metricFavourites/metricFavourites.component';
import '../metricFilters/metricFilters.component';
const alertVia = [{
        label: 'Email instant',
        value: 'email_instant'
    },
    {
        label: 'Email digest',
        value: 'email_digest'
    },
    {
        label: 'Web',
        value: 'web'
    }
];

const alertLevels = [{
        label: 'Low',
        value: 'low'
    },
    {
        label: 'Medium',
        value: 'medium'
    },
    {
        label: 'High',
        value: 'high'
    }
];

const alertFrequencies = [{
        label: 'Hourly',
        value: 'hourly'
    },
    {
        label: 'Daily',
        value: 'daily'
    },
    {
        label: 'Weekly',
        value: 'weekly'
    }
];

class CreateMetricAlertCtrl {
    constructor(Auth, MetricService, SmartAlertsService, OrganisationService, $state, toaster, $q, AppEventsService) {
        this.user = Auth.user;
        this.MetricService = MetricService;
        this.AppEventsService = AppEventsService;
        this.SmartAlertsService = SmartAlertsService;
        this.OrganisationService = OrganisationService;
        this.$state = $state;
        this.toaster = toaster;
        this.$q = $q;

        this.viewMode = $state.current.data.viewMode;

        this.loading = {
            alert: false,
            alertSaving: false
        };

        this.blank = [];
        this.metrics = [];
        this.organisationUsers = [];
        this.alertVia = alertVia;
        this.alertLevels = alertLevels;
        this.alertFrequencies = alertFrequencies;
    }

    onMetricSelect() {
        this.form.filters = [];
    }

    applyRule(event) {
        const { rule } = event;
        this.form.filtersRule = rule;
    }

    applyFilter(event) {
        const { filter } = event;

        this.form.filters = [...this.form.filters, filter];
        this.updateFilterRules();
    }

    removeFilter(event) {
        const { index } = event;

        if(index < 0 || index > this.form.filters.length) {
            return;
        }

        this.form.filters = this.form.filters.filter((filter, i) => i !== index);
        this.updateFilterRules();
    }

    updateFilter(event) {
        const { index, filter } = event;

        this.form.filters[index] = filter;
    }

    updateFilterRules() {
        const existingFilters = this.form.filters;
        if(existingFilters.length > 0) {
            let filtersRule = `${existingFilters[0].chainLetter}`;

            for(let i = 1; i < existingFilters.length; i++) {
                filtersRule += ` AND ${existingFilters[i].chainLetter} `;
            }

            this.form.filtersRule = filtersRule;
        } else {
            this.form.filtersRule = '';
        }
    }

    $onInit() {
        this.loading.alert = true;

        this.preselect();

        const promises = {
            users: this.loadUsers(),
            metrics: this.loadMetrics()
        };

        if (this.viewMode === 'update') {
            promises.form = this.loadForm();
        }

        this.$q.all(promises)
            .then(data => {
                const { users, metrics } = data;

                this.organisationUsers = users;
                this.metrics = metrics;

                if (this.viewMode === 'update') {
                    this.form = data.form;

                    this.form.users = users.filter(user => data.form.users.includes(user.value));
                    const metric = metrics.find(metric => metric.value === this.form.metric);
                    this.form.metric = metric;

                    if (!metric) {
                        this.toaster.error('Metric not found!');
                        this.$state.go('smartAlerts', {
                            layout: 'table'
                        });
                    }
                } else {
                    this.form.metric = metrics[0];
                }
            })
            .catch(() => {
                this.toaster.error('Error occurred, please try later');
                this.$state.go('home');
            })
            .finally(() => {
                this.loading.alert = false;
            });
    }

    preselect() {
        this.form = {
            name: '',
            description: '',
            metric: null,
            table: null,
            dateRange: 'year',
            frequency: this.alertFrequencies[0],
            alert_level: this.alertLevels[0],
            users: [],
            alertVia: [this.alertVia[0]],
            filtersRule: '',
            filters: []
        };
    }

    loadForm() {
        const alertId = this.$state.params.alertId;

        return this.SmartAlertsService.getAlert(alertId)
            .then((response) => {
                const form = this.getFormFromApiResponse(response);

                return form;
            });
    }

    loadUsers() {
        return this.OrganisationService.loadUsers().then(users => {
            const organisationUsers = users.map(user => ({
                value: user.id,
                email: user.email,
                label: user.fullName,
            }));

            return organisationUsers;
        });
    }

    loadMetrics() {
        return this.MetricService.getList().then(metrics => {
            const mappedMetrics = metrics.map(metric => ({
                value: metric.id,
                label: metric.name,
                source: metric.source,
            }));

            return mappedMetrics;
        });
    }

    save() {
        this.loading.alertSaving = true;

        let message, request;
        const convertedData = this.convertFormToApiRequest(this.form);

        if (this.viewMode === 'create') {
            message = 'Alert created';
            request = this.SmartAlertsService.createAlert(convertedData);
        } else {
            message = 'Alert updated';
            request = this.SmartAlertsService.updateAlert(convertedData);
        }

        request.then(response => {
            if (this.viewMode === 'create') {
                this.AppEventsService.track('smart-alert-created', {id: response.id});
            } else {
                this.AppEventsService.track('smart-alert-updated', {id: response.id});
            }
            
            this.toaster.success(message);
            this.$state.go('smartAlerts', {
                layout: 'table'
            });
        }).catch((e) => {
            this.toaster.error('Error occurred, please try later');
            this.$state.go('home');
        }).finally(() => {
            this.loading.alertSaving = false;
        });
    }

    convertFormToApiRequest(form) {
        const formClone = _.clone(form);

        formClone.users = form.users.map(u => u.value);
        formClone.alertVia = [this.alertVia[2].value]; // temporary hardcoded only to send 'web' value
        formClone.alert_level = form.alert_level.value;
        formClone.frequency = form.frequency.value;
        formClone.metric = form.metric.value;

        return formClone;
    }

    getFormFromApiResponse(form) {
        const formClone = _.clone(form);

        formClone.alertVia = form.alertVia ? this.alertVia.filter(via => form.alertVia.includes(via.value)) : [];
        formClone.frequency = this.alertFrequencies.find(f => f.value === form.frequency.toLowerCase());
        formClone.alert_level = this.alertLevels.find(level => level.value === form.alert_level);
        formClone.users = form.users || [];
        formClone.filters = form.filters ? form.filters.sort((a, b) => a.chainLetter.localeCompare(b.chainLetter)) : [];
        formClone.filtersRule = form.filtersRule || '';
    
        formClone.filters.forEach(filter => {
            if(!filter.values) {
                filter.values = filter.value.split(',');
            }
        });
        
        return formClone;
    }
}

truedashApp.component('appCreateMetricAlert', {
    controller: CreateMetricAlertCtrl,
    templateUrl: 'content/smartAlerts/createMetricAlert/createMetricAlert.html'
});
