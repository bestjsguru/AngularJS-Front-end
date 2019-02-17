'use strict';

import {Config} from './config';
import './card/highchart/changeColors/highchartChangeColors.component';

truedashApp.run(function ($rootScope, hotkeys, $state, $uibModal, AddDashboardModalService, CustomiseDashboardModalService,
                          DashboardCollection, CacheService, toaster, NotificationMessage, SmartAlertsFactory, Auth) {

    hotkeys.bindTo($rootScope)
        .add({
            combo: ['g left'],
            description: 'Go back',
            callback: function () {
                window.history.back();
            }
        })
        .add({
            combo: ['g right'],
            description: 'Go forward',
            callback: function () {
                window.history.forward();
            }
        })
        .add({
            combo: ['p d'],
            description: 'Profile details',
            callback: function () {
                $state.go('profile.profile');
            }
        })
        .add({
            combo: ['n d'],
            description: 'New dashboard',
            callback: function () {
                AddDashboardModalService.open();
            }
        })
        .add({
            combo: ['e d'],
            description: 'Edit dashboard',
            callback: function () {
                CustomiseDashboardModalService.open();
            }
        })
        .add({
            combo: ['c b', 'n c'],
            description: 'Card Builder',
            callback: function () {
                $state.go('cardBuilder');
            }
        })
        .add({
            combo: ['mod+backspace'],
            description: 'Clear cache',
            callback: function () {
                CacheService.removeAll(false);
                toaster.success('Cache cleared');
            }
        });

    if(Config.isDev) {
        hotkeys.bindTo($rootScope).add({
            combo: ['c c c'],
            description: 'Change chart colors',
            callback: function () {
                $uibModal.open({
                    size: 'md',
                    component: 'appHighchartChangeColors'
                });
            }
        });
        
        if(Config.apiai[Auth.user.organisation.id]) {
            hotkeys.bindTo($rootScope).add({
                combo: ['shift shift'],
                description: 'Sentence builder',
                callback: function () {
                    $uibModal.open({
                        size: 'md',
                        component: 'appSentenceBuilder',
                        backdrop: 'static'
                    });
                }
            });
        }
    }

    if(window.isDemo) {
        hotkeys.bindTo($rootScope).add({
            combo: ['s a'],
                description: 'Run smart alert',
                callback: function () {
                    let data = {
                        "id":39122,
                        "user":"fe+ba@truedash.com",
                        "alertId":490,
                        "read":false,
                        "createdDate":1500037495077,
                        "readDate":null,
                        "alert":{
                            "id":490,
                            "organisation":1,
                            "objectId":12649,
                            "objectName":"Sales",
                            "triggeredAt":1491955200000,
                            "alertType":"smart",
                            "alertName":"Sales are unusually low",
                            "alertDatetimePosition":1491955200000,
                            "alertGroup":3,
                            "alertSeverity":"medium",
                            "alertTimeResolution":"daily",
                            "alertGood":false,
                            "actualValue":95225.44,
                            "expectedValue":107499.92,
                            "variance":-0.11,
                            "lowerBound":99397.76,
                            "upperBound":116354.72,
                            "symbol":null,
                            "alertRead":true,
                            "assignedByUserId":null,
                            "assignedDatetime":null,
                            "assignedToUserId":null,
                            "status":"Unresolved",
                            "statusLastUpdated":1491955200000
                        }
                    };
    
                    let alerts = SmartAlertsFactory.create([]);
                    let notification = alerts.add(data);

                    NotificationMessage[notification.alert.isGood ? 'success' : 'error']({
                        title: notification.metric.name,
                        data: {notification: notification},
                        template: 'smartAlertsTemplate',
                        buttons: [
                            {
                                text: 'Analyse',
                                action: () => {
                                    return $state.go('alerts', {metricId: notification.metric.id});
                                }
                            }
                        ]
                    }).white().show();
    
                    $rootScope.$broadcast('smartAlert.unread', [data]);
                }
            });
    }

    $rootScope.openCheatSheet = function () {
        hotkeys.toggleCheatSheet();
    };
});
