'use strict';

class DashboardController {
    
    constructor($scope, DeregisterService, AppEventsService) {
        this.AppEventsService = AppEventsService;
        
        this.firstShow = false;

        this.watchers = DeregisterService.create($scope);

        this.watchers.watch('$ctrl.active', (active) => {
            if (active) {
                //need to enable gridster container after it will be visible
                //for some reason it need to be in next digest
                //since dashboard container is shown after
                //this watcher triggers
                this.watchers.timeout(() => {
                    this.firstShow = true;
                });
            }
        });
    }

    $onInit() {
        this.firstShow = true;
        this.getDashboardPermissions();
    
        this.AppEventsService.track('dashboard-page', {id: this.dashboard.id, email: this.dashboard.createdBy});
    }

    $onChanges(changes) {
        if (changes.permissions && !changes.permissions.isFirstChange()) {
            this.permissions = angular.copy(this.permissions);

            this.getDashboardPermissions();
        }
    }

    getDashboardPermissions() {
        const { canDragOrResizeCard, canEditCard, canHideCard, canDeleteCard } = this.permissions;
        this.cardPermissions = {
            canEditCard,
            canHideCard,
            canDeleteCard
        };

        this.gridsterOptions = {
            resizable: {
                enabled: canDragOrResizeCard
            },
            draggable: {
                enabled: canDragOrResizeCard
            }
        };
    }

    showNewCardButton() {
        return !this.dashboard.isLocked() && !this.dashboard.reachedCardsLimit;
    }

    getCards() {
        return this.firstShow ? this.dashboard.cards.getActive() : [];
    }

    invalidate() {
        this.dashboard.cards.invalidate();
    }
}

truedashApp.component('tuDashboard', {
    controller: DashboardController,
    templateUrl: 'content/dashboard/dashboard.html',
    bindings: {
        dashboard: '=',
        active: '=',
        permissions: '<'
    }
});
