'use strict';

import '../../smartAlerts/smartAlerts.service';
import '../../smartAlerts/unreadAlerts/unreadAlerts.service';

class HomeAlertsCtrl {

    constructor(SmartAlertsService, DeregisterService, $scope, $window, $document, $element, UnreadAlertsService) {
        this.$window = $window;
        this.SmartAlertsService = SmartAlertsService;
        this.watchers = DeregisterService.create($scope);
        this.$document = $document;
        this.$element = $element;
        this.UnreadAlertsService = UnreadAlertsService;

        this.notifications = [];
        this.loading = false;
        this.isVisible = false;
        this.limit = 50;
    }
    
    $onInit() {
        this.loading = true;
        this.SmartAlertsService.getUnread().then((notifications) => {
            this.allNotifications = notifications;
            this.UnreadAlertsService.number = notifications.items.length;
            
            this.limitNotifications();
            
        }).finally(() => {
            this.loading = false;
        });
    
        this.watchers.onRoot('smartAlert.read', (event, alerts) => {
            this.allNotifications.items = this.allNotifications.items.filter(item => {
                return !alerts.find(alert => item.id === alert.id);
            });
            
            this.limitNotifications();
        });
        this.watchers.onRoot('smartAlert.unread', (event, alerts) => {
            alerts.forEach(alert => {
                !this.allNotifications.getById(alert.id) && this.allNotifications.add(alert);
            });
            this.allNotifications.sortSmartAlerts();
            this.limitNotifications();
        });
    
        this.watchers.onRoot('homeAlerts.show', () => this.show());
    
        this.closeOnClick();
    }
    get moreThanLimit() {
        return this.allNotifications && this.allNotifications.items.length > this.limit;
    }
    
    limitNotifications() {
        this.notifications = _.clone(this.allNotifications);
        this.notifications.items = this.allNotifications.items.slice(0, this.limit);
    }
    
    closeOnClick() {
        // Hide menu when clicked on any dropdown on page because
        // dropdowns will prevent regular click event from happening
        this.$document.on('show.bs.dropdown', () => {
            this.isVisible && this.hide();
        });
        
        // Hide menu when clicked outside of it anywhere on page
        this.$document.bind('click', (event) => {
            if(!this.isVisible) return;
        
            let element = angular.element(event.target);
            let clickedOutside = this.$element.find(event.target).length === 0;
            let clickedOnSingleAlert = element.hasClass('home-alert') || element.parents('.home-alert').length > 0;
            let clickedOnShowAllAlerts = element.parents('.home-alerts-footer').length > 0;
        
            let shouldBeClosed = clickedOutside || clickedOnSingleAlert || clickedOnShowAllAlerts;
        
            shouldBeClosed && this.hide();
        });
    }
    
    toggle() {
        this.isVisible ? this.hide() : this.show();
    }
    
    hide() {
        this.$element.find('.home-alerts').removeClass('open');
        
        this.watchers.timeout(() => {
            this.isVisible = false;
        });
    }
    
    show() {
        this.isVisible = true;
        
        this.watchers.timeout(() => {
            this.UnreadAlertsService.hide();
            
            this.$element.find('.home-alerts').addClass('open');
        });
    }
}

truedashApp.component('appHomeAlerts', {
    controller: HomeAlertsCtrl,
    templateUrl: 'content/home/homeAlerts/homeAlerts.html',
});
