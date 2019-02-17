'use strict';

import '../anomalyDetection/singleAnomaly/singleAnomaly.component';
import '../anomalyDetection/cardAnomalies';
import './metricFavourites/metricFavourites.component';
import './createMetricAlert/createMetricAlert.component';
import './metricAlerts/metricAlerts.component';
import './unreadAlerts/unreadAlerts.component';
import ConvertFilter from '../../content/builder/filters/convertFilter';
import {FilterModel} from '../../content/card/model/filter.model';

class SmartAlertsCtrl {
    constructor($state, DeregisterService, $scope, CardFactory, $confirm, UnreadAlertsService, AppEventsService,
                toaster, $window, $uibModal, Auth, $rootScope, SmartAlertsService, OrganisationService, CardAnomaliesFactory, $q) {
        this.$state = $state;
        this.CardFactory = CardFactory;
        this.AppEventsService = AppEventsService;
        this.SmartAlertsService = SmartAlertsService;
        this.toaster = toaster;
        this.$window = $window;
        this.watchers = DeregisterService.create($scope);
        this.$uibModal = $uibModal;
        this.user = Auth.user;
        this.$rootScope = $rootScope;
        this.CardAnomaliesFactory = CardAnomaliesFactory;
        this.$confirm = $confirm;
        this.UnreadAlertsService = UnreadAlertsService;
        this.OrganisationService = OrganisationService;
        this.$q = $q;

        this.form = {};
        this.filters = {};
        this.pagination = {};
        this.cards = [];
        this.alerts = [];

        this.show = [
            {label: 'All alerts', value: 'all'},
            {label: 'New alerts', value: 'new'},
        ];
        this.levels = [
            {label: 'Low', value: 'low'},
            {label: 'Medium', value: 'medium'},
            {label: 'High', value: 'high'}
        ];
        this.frequencies = [
            {label: 'Hourly', value: 'hourly'},
            {label: 'Daily', value: 'daily'},
            {label: 'Weekly', value: 'weekly'}
        ];
        this.isGood = [
            {label: 'Good', value: 'true'},
            {label: 'Bad', value: 'false'}
        ];
    }

    $onInit() {
        this.preselect();

        this.filter(true).then(() => this.UnreadAlertsService.hide());

        this.watchers.onRoot('highchart.point.click', (e, point) => {

            point = _.clone(point);

            if(point.anomaly && point.anomaly.isAnomaly) {
                this.cards.some(card => {
                    card.anomalies && card.anomalies.has(point.anomaly) && this.$uibModal.open({
                        size: 'md',
                        component: 'appSingleAnomaly',
                        resolve: {
                            anomaly: () => point.anomaly,
                            card: () => card,
                        }
                    });
                });
            }
        });

        this.watchers.watch('$ctrl.layout', (current, previous) => {
            // Trigger window resize in order to fit charts to new card sizes
            angular.element(this.$window).trigger('resize');
            this.setUrlParams();

            if(current !== previous && previous === 'table') {
                this.pagination.perPage = 10;
                this.filter();
            }

            if(current !== previous && current === 'table') {
                this.pagination.perPage = 30;
                this.filter();
            }
        });
    }

    preselect() {
        this.layout = ['list', '2columns', '3columns', 'table'].find(item => item === this.$state.params.layout) || '3columns';
        this.pagination.currentPage = +this.$state.params.page || 1;
        this.pagination.perPage = +this.$state.params.size || (this.layout === 'table' ? 30 : 10);
        this.form.metric = this.$state.params.metric || '';
        this.form.show = this.show.find(item => item.value.toLowerCase() === this.$state.params.show) || this.show[0];
        this.form.level = this.levels.find(item => item.value.toLowerCase() === this.$state.params.level);
        this.form.frequency = this.frequencies.find(item => item.value.toLowerCase() === this.$state.params.frequency);
        this.form.isGood = this.isGood.find(item => item.value.toLowerCase() === this.$state.params.isGood);
    }

    setUrlParams() {
        let params = {
            layout: this.layout,
            page: this.pagination.currentPage,
            size: this.pagination.perPage,
            metric: this.form.metric || null,
            show: this.form.show ? this.form.show.value.toLowerCase() : null,
            level: this.form.level ? this.form.level.value.toLowerCase() : null,
            frequency: this.form.frequency ? this.form.frequency.value.toLowerCase() : null,
            isGood: this.form.isGood ? this.form.isGood.value.toLowerCase() : null,
        };

        this.$state.go('.', params, {notify: false});
    }

    filter(firstLoad = false) {
        this.filters = {};

        this.form.metric ? this.filters.metric = this.form.metric : delete this.filters.metric;
        this.form.show ? this.filters.show = this.form.show.value : delete this.filters.show;
        this.form.level ? this.filters.level = this.form.level.value : delete this.filters.level;
        this.form.frequency ? this.filters.frequency = this.form.frequency.value : delete this.filters.frequency;
        this.form.isGood ? this.filters.isGood = this.form.isGood.value : delete this.filters.isGood;

        // Always return to first page when filters are applied except on initial page load
        // User might want to refresh certain page and we don't want to reset in that case
        if(!firstLoad) this.pagination.currentPage = 1;

        if (this.layout === 'table') {
            return this.loadTableData();
        } else {
            return this.getAnomalies();
        }
    }

    reset() {
        this.layout = this.layout || '3columns';
        this.pagination.currentPage = 1;
        this.pagination.perPage = this.layout === 'table' ? 30 : 10;
        this.form.metric = '';
        this.form.show = this.show[0];
        this.form.level = null;
        this.form.frequency = null;
        this.form.isGood = null;

        this.setUrlParams();
        this.filter();
    }

    layoutClass() {
        if(this.layout === 'list') return 'col-md-12';
        if(this.layout === '2columns') return 'col-md-6';

        return 'col-md-4';
    }

    getAnomalies(page = this.pagination.currentPage, size = this.pagination.perPage, filters = this.filters) {
        this.cards = [];
        this.loading = true;

        this.setUrlParams();

        filters.showNoData = true;

        return this.SmartAlertsService.getMetrics(page, size, filters).then(response => {
            if (angular.isArray(response.anomalyDetections)) {
                response.anomalyDetections.forEach(item => {
                    this.cards.push(this.createCard(item.anomalyInfo));
                });

                this.pagination.total = response.total;

                this.cards.sort((a, b) => a.id - b.id);
            } else {
                this.toaster.warning('There are no alerts.');
            }
        }).catch(() => {
            this.toaster.error(`Alerts couldn't be loaded.`);
        }).finally(() => {
            this.loading = false;
        });
    }

    createCard(metric) {
        let card = this.CardFactory.create();

        // We set unique card id to be able to use it in events that are fired for card exporting / download
        card.id = metric.id;
        card.name = metric.name;
        card.description = metric.description;
        card.types.type = 'line';
        card.types.subType = 'arearange';
        card.frequencies.selected = metric.frequency || 'hourly';
        card.fillChart = true;

        this.layout !== 'table' && this.loadCardAnomalies(card);

        return card;
    }

    loadCardAnomalies(card) {
        card.metrics.loading = true;
    
        card.metrics.clearErrors();

        return this.SmartAlertsService.getMetricAnomalies(card.id).then(response => {
            if (response.anomalyDetections && response.anomalyDetections.length) {
    
                let anomalies = response.anomalyDetections[0].anomalies || [];
                let data = anomalies.map(anomaly => [anomaly.data, anomaly.value]);
                data.sort((a, b) => a[0] - b[0]);
    
                card.metrics.add(response.anomalyDetections[0].metric, data);

                // Check for anomaly errors
                if(response.anomalyDetections[0].isError) {
                    card.metrics.setError('loadData', true, response.anomalyDetections[0].error);
                }

                let rangeMetric = angular.copy(response.anomalyDetections[0].metric);
                rangeMetric.name = 'Range';
                rangeMetric.type = 'arearange';

                let rangeMetricData = anomalies.map(anomaly => [anomaly.data, anomaly.lowerBound, anomaly.upperBound]);
                rangeMetricData.sort((a, b) => a[0] - b[0]);
                card.metrics.add(rangeMetric, rangeMetricData);


                card.anomalies = this.CardAnomaliesFactory.create(anomalies, response.anomalyDetections[0].metric);
            } else {
                card.metrics.setError('load', true, 'Metric not found');
            }
        }).catch(() => {
            card.metrics.setError('loadData', true, `Alerts couldn't be loaded.`);
        }).finally(() => {
            card.metrics.loading = false;
        });
    }

    isNewAlerts() {
        return this.form.show && this.form.show.value === 'new';
    }

    download(cardId, type, title) {
        this.$rootScope.$emit('card.download.' + cardId, {type, title});
    }

    expand(card) {
        let params = this.$state.params;
        params.metricId = card.id;

        this.$state.go('alerts', params);
    }

    readAllAlerts() {
        let message = 'This action cannot be undone. Are you sure you want to mark all alerts as read?';
        this.$confirm({text: message}).then(() => {
            this.SmartAlertsService.readAll().then((alerts) => {
                // Refresh all cards on current page
                this.cards.forEach(card => card.anomalies.readAll());

                if(alerts.length) {
                    this.toaster.success(`You just marked ${alerts.length} alerts as read`);
                } else {
                    this.toaster.success(`There was no unread alerts`);
                }
            });
        });
    }

    readAllCardAlerts(card) {
        this.SmartAlertsService.readAllByMetric(card.metrics.get(0).id).then(() => {
            card.anomalies.readAll();
        });
    }

    loadTableData() {
        const getAlerts = function () {
            return this.SmartAlertsService.getAllAlerts().then(alerts => {
                return alerts;
            }).catch((e) => {
                return [];
            });
        }.bind(this);

        const getOrganisationUsers = function () {
            return this.OrganisationService.loadUsers(true).then(users => {
                const organisationUsers = users.map(u => ({
                    id: u.id,
                    fullName: u.fullName
                }));

                return organisationUsers;
            });
        }.bind(this);

        return this.$q.all({ alerts: getAlerts(), users: getOrganisationUsers() }).then(data => {
            const { alerts, users } = data;

            alerts.forEach((alert) => {
                const userIds = alert.users || [];

                const userNames = userIds.map(id => {
                    let userName = '';

                    const user = users.find(user => user.id === id);
                    if (user) {
                        userName = user.fullName;
                    }

                    return userName;
                });
                alert.users = userNames;

                const frequency = this.frequencies.find(f => f.value === alert.frequency.toLowerCase());
                if (frequency) {
                    alert.frequency = frequency.label;
                }

                alert.filters = _.isArray(alert.filters)
                    ? alert.filters
                        .filter(filter => filter !== null)
                    : [];

                alert.isSubscribed = !!alert.subscribers.find(subscriber => subscriber.user === this.user.id);
            });

            this.alerts = alerts;
        }).catch((e) => {
            console.error(e);
            this.toaster.error("Error occured, please try later");
        });
    }

    convertFilter(filter) {
        return (new ConvertFilter()).toText(new FilterModel(filter));
    }

    confirmRemove(alert) {
        let message = `Are you sure you want to remove alert ${alert.name}?`;
        this.$confirm({ text: message }).then(() => {
            this.SmartAlertsService.deleteAlert(alert.id).then(() => {
                this.alerts = this.alerts.filter(a => a.id !== alert.id);
                this.AppEventsService.track('smart-alert-removed', {id: alert.id});
                this.toaster.success(`Alert has been successfully deleted`);
            })
            .catch(() => {
                this.toaster.error('Error occurred, please try later');
            });
        });
    }

    subscribe(alert) {
        const id = alert.id, fullName = this.user.fullName;
        let request;

        if (alert.isSubscribed) {
            request = () => {
                return this.SmartAlertsService.unSubscribe(id).then(() => {
                    alert.users = alert.users.filter(user => user !== fullName);
                    alert.isSubscribed = false;
                    this.toaster.success('Unsubscribed');
                });
            };
        } else {
            request = () => {
                return this.SmartAlertsService.subscribe(id, {
                    emailDigest: false,
                    emailInstant: false
                }).then(() => {
                    alert.users = [...alert.users, fullName];
                    alert.isSubscribed = true;
                    this.toaster.success('Subscribed');
                });
            };
        }

        this.loading = true;
        request().catch((e) => {
            this.toaster.error('Error, please try later');
        }).finally(() => {
            this.loading = false;
        });
    }
    
    userCanEdit() {
        return this.user.hasPermission('smart-alerts-management');
    }
    
    refresh(card) {
        card.loading = true;
    
        this.SmartAlertsService.refreshMetricAnomalies(card.id).then(response => {
            if(response.newAnomalies) {
                this.loadCardAnomalies(card);
                this.toaster.success(response.newAnomalies + ' new alerts loaded', card.metrics.get(0).getName());
            } else {
                this.toaster.info('There are no new alerts', card.metrics.get(0).getName());
            }
            
        }).catch(() => {
        
        }).finally(() => {
            card.loading = false;
        });
    }
}

truedashApp.component('appSmartAlerts', {
    controller: SmartAlertsCtrl,
    templateUrl: 'content/smartAlerts/smartAlerts.html'
});
