'use strict';

import {Config} from '../config';
import '../home/homeAlerts/homeAlerts.component';
import './header/logo/headerLogo.component';
import './customTheme/customThemeStyle.component';
import '../common/countWatchers';

class indexCtrl {
    constructor(Auth, CacheService, $scope, getWatchCount, PusherService, SmartAlertsFactory,
                DashboardCollection, CardCacheHelperService, NotificationMessage, $state, $rootScope) {
        this.Auth = Auth;
        this.$state = $state;
        this.$rootScope = $rootScope;
        this.CacheService = CacheService;
        this.PusherService = PusherService;
        this.SmartAlertsFactory = SmartAlertsFactory;
        this.DashboardCollection = DashboardCollection;
        this.NotificationMessage = NotificationMessage;
        this.CardCacheHelperService = CardCacheHelperService;
        
        this.themeClass = this.CacheService.getPermanent('color.theme.class', null);
        
        if(Config.countWatchers) {
            this.countWatchers($scope, getWatchCount);
        }
        
        this.user = this.Auth.user;
        
        this.bindPusherEvents();
    }
    
    bindPusherEvents() {
        this.PusherService.user.listenFor('feed.notification', (data) => {
            this.NotificationMessage.error({
                title: 'Feed error',
                data: {data: data},
                template: 'feedAlertTemplate',
                buttons: [
                    {
                        text: 'Go to feeds',
                        action: () => {
                            return this.$state.go('feeds');
                        }
                    }
                ]
            }).white().show();
        });
    
        this.PusherService.organisation.listenFor('smart.alert.notification', (data) => {
            let alerts = this.SmartAlertsFactory.create([]);
            let notification = alerts.add(data);
        
            this.NotificationMessage[notification.alert.isGood ? 'success' : 'error']({
                title: notification.metric.name,
                data: {notification: notification},
                template: 'smartAlertsTemplate',
                buttons: [
                    {
                        text: 'Analyse',
                        action: () => {
                            return this.$state.go('smartAlerts');
                        }
                    }
                ]
            }).white().show();
        });
    
        this.PusherService.organisation.listenFor('integration.link', (data) => {
            this.DashboardCollection.loadByCardId(data.card).then(dashboard => {
                let cardData = this.CardCacheHelperService.addIntegrationLink(data, dashboard);
    
                if(cardData) {
                    let card = this.DashboardCollection.findCard(data.card);
    
                    card.init(cardData);
    
                    this.$rootScope.$emit('card.updated', data.card);
                }
            });
        });
        
        this.PusherService.organisation.listenFor('integration.link.delete', (data) => {
            this.DashboardCollection.loadByCardId(data.card).then(dashboard => {
                let cardData = this.CardCacheHelperService.deleteIntegrationLink(data, dashboard);
    
                if(cardData) {
                    let card = this.DashboardCollection.findCard(data.card);
    
                    card.init(cardData);
    
                    this.$rootScope.$emit('card.updated', data.card);
                }
            });
        });
    }
    
    countWatchers($scope, getWatchCount) {
        // Every time the digest runs, it's possible that we'll change the number
        // of $watch() bindings on the current page.
        $scope.$watch(
            function watchCountExpression() {
                return ( getWatchCount() );
            },
            function handleWatchCountChange(newValue) {
                console.log(newValue);
            }
        );
    }

    get isExport() {
        return window.Location.isExport;
    }
    
    get isEmbed() {
        return window.Location.isEmbed;
    }
    
    get isPhone() {
        return Config.isPhone;
    }
    
    get isTablet() {
        return Config.isTablet;
    }
    
    get year() {
        return moment().year();
    }
    
    isVisible() {
        return this.Auth.isLoggedIn() && !window.Location.isLogin && !window.Location.isCallback && !window.Location.isLogout && !this.isExport;
    }
}

truedashApp.controller('indexCtrl', indexCtrl);
