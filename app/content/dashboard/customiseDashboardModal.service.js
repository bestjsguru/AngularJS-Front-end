'use strict';

import '../timezonePicker/timezonePicker.component';
import './theme/dashboardTheme.component';

class CustomiseDashboardModalCtrl {
    constructor(dashboardId, $uibModalInstance, DashboardCollection, OrganisationService, toaster, $scope, $state, DeregisterService,
                CardCacheHelperService, FavouriteDashboardService, Auth, $rootScope) {
        this.$state = $state;
        this.$scope = $scope;
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.$uibModalInstance = $uibModalInstance;
        this.DashboardCollection = DashboardCollection;
        this.OrganisationService = OrganisationService;
        this.CardCacheHelperService = CardCacheHelperService;
        this.FavouriteDashboardService = FavouriteDashboardService;
        this.Auth = Auth;

        this.watchers = DeregisterService.create($scope);

        this.form = [];
        this.dashboard = {};
        this.currentDashboard = this.DashboardCollection.getById(dashboardId);

        this.tab = 'details';
        this.loading = {
            details: false,
            administrators: true
        };

        this.days = [
            { value: 1, label: 'Monday'},
            { value: 2, label: 'Tuesday'},
            { value: 3, label: 'Wednesday'},
            { value: 4, label: 'Thursday'},
            { value: 5, label: 'Friday'},
            { value: 6, label: 'Saturday'},
            { value: 7, label: 'Sunday'},
        ];

        if (this.currentDashboard) {
            this.dashboard.id = this.currentDashboard.id;
            this.dashboard.theme = this.currentDashboard.theme;
            this.dashboard.name = this.currentDashboard.name;
            this.dashboard.description = this.currentDashboard.description;
            this.dashboard.useTimezone = this.currentDashboard.useTimezone;
            this.dashboard.timezone = this.currentDashboard.timezone;
            this.dashboard.createdBy = this.currentDashboard.createdBy;
    
            this.dashboard.useStartDayOfWeek = this.currentDashboard.useStartDayOfWeek;
            this.dashboard.startDayOfWeek = this.currentDashboard.startDayOfWeek;
    
            this.days.selected = this.days[this.dashboard.startDayOfWeek - 1];
        }

        this.administrators = [];
        this.dashboardOwner = {};
        this.getAdmins();

        $scope.$on('$destroy', () => this.DashboardCollection.off(null, null, this));
    }

    /**************************************************************************
     * Cards tab related functions
     **************************************************************************/
    toggleCard(card) {
        if(!this.canModifyCards()) {
            return;
        }

        card.active = !card.active;
        let dashboard = card.dashboard;
        let status = card.active;

        card.loading = true;
        dashboard.cards.setCardStatus(card, status).then(() => {
            return this.FavouriteDashboardService.load().then((favouriteDashboard) => {
                if (favouriteDashboard) {
                    this.CardCacheHelperService.setCard(favouriteDashboard, card);
                }
            });
        }).finally(() => {
            card.loading = false;

            this.toaster.success('Card "' + card.getName() + '" ' + (status ? 'activated' : 'deactivated'));
        });
    }

    onUseTimezoneClick() {
        this.dashboard.useTimezone = !this.dashboard.useTimezone;
    }

    timezoneSentence() {
        let sentence = [
            `* This dashboard is using the user profile's specified timezone <strong>${window.Auth.user.timezoneString()}</strong>.`
        ];

        if(this.dashboard.useTimezone) {
            sentence[0] = `* This dashboard's timezone is set to <strong>${this.dashboard.timezone}</strong>.`;
            sentence[1] = 'This overrides timezone set at the <strong>user profile</strong> level.';
        }

        return sentence.join(' ');
    }

    deleteCard(card) {
        card.deleting = true;
        card.remove().then(()=> {
            this.toaster.success('Card "' + card.getName() + '" deleted');
            card.deleting = false;
        }).catch(() => {
            this.toaster.error('There was an error trying to delete card "' + card.getName() + '"');
            card.deleting = false;
            card.confirmDelete = false;
        });
    }

    update() {
        if (!this.currentDashboard) return;
        // Don't submit if form is invalid
        if (this.form.$invalid) return;

        this.loading.details = true;

        // This has to be calculated before calling update because update will override current values
        let requiresCardRefresh = this.timezoneChanged() || this.startDayOfWeekChanged();

        this.DashboardCollection.update(this.currentDashboard, this.dashboard).then(() => {
            this.close();
            this.toaster.success('Dashboard details updated');

            if(requiresCardRefresh) {
                this.$rootScope.$emit('dashboard.restoreOriginalCardData');
            }
        }).catch((message) => {
            this.toaster.error(message);
        }).finally(() => {
            this.loading.details = false;
        });
    }

    ownerChanged() {
        return this.currentDashboard.createdBy !== this.dashboard.createdBy;
    }

    timezoneChanged() {
        let userOffset = moment().tz(window.Auth.user.timezone).format('Z');
        let oldOffset = moment().tz(this.currentDashboard.timezone).format('Z');
        let newOffset = moment().tz(this.dashboard.timezone).format('Z');

        if(this.currentDashboard.useTimezone !== this.dashboard.useTimezone) {
            if(!this.dashboard.useTimezone) {
                if(oldOffset !== userOffset) {
                    return true;
                }
            } else if(newOffset !== userOffset) {
                return true;
            }
        } else if(this.dashboard.useTimezone && oldOffset !== newOffset) {
            return true;
        }

        return false;
    }
    
    startDayOfWeekChanged() {
        let userStart = window.Auth.user.organisation.startDayOfWeek;
        let oldStart = this.currentDashboard.startDayOfWeek;
        let newStart = this.dashboard.startDayOfWeek;

        if(this.currentDashboard.useStartDayOfWeek !== this.dashboard.useStartDayOfWeek) {
            if(!this.dashboard.useStartDayOfWeek) {
                if(oldStart !== userStart) {
                    return true;
                }
            } else if(newStart !== userStart) {
                return true;
            }
        } else if(this.dashboard.useStartDayOfWeek && oldStart !== newStart) {
            return true;
        }

        return false;
    }

    remove() {
        if (!this.currentDashboard) return;
        this.loading.details = true;

        this.DashboardCollection.remove(this.currentDashboard).then(()=> {
            this.close();
            this.toaster.success('Dashboard deleted');
        }).catch(() => {
            this.toaster.error('There was an error while removing dashboard');
        }).finally(() => {
            this.loading.details = false;
        });
    }

    close() {
        this.$uibModalInstance.dismiss();
    }

    dirty(field) {
        return field.$dirty;
    }

    getAdmins() {
        this.OrganisationService.loadUsers().then(users => {
            this.administrators = users.filter(user => user.isAdmin());
            this.dashboardOwner = users.find(user => user.email === this.currentDashboard.createdBy);
            this.loading.administrators = false;
        });
    }

    changeOwner(admin) {
        this.dashboard.createdBy = admin.email;
    }
    
    takeOwnership() {
        let owner = this.administrators.find(owner => owner.id === this.Auth.user.id);
        
        if(owner) {
            this.dashboardOwner = owner;
            this.administrators.selected = owner;
            this.changeOwner(owner);
        }
    }

    canChangeOwner() {
        return this.currentDashboard.isOwner() || this.Auth.user.isAdmin();
    }
    
    canModifyCards() {
        return this.currentDashboard.isOwner();
    }

    onUseStartDayOfWeekClick() {
        this.dashboard.useStartDayOfWeek = !this.dashboard.useStartDayOfWeek;
    }
    
    onStartDayChange() {
        this.dashboard.startDayOfWeek = this.days.selected.value;
    }
}

class CustomiseDashboardModalService {
    constructor($uibModal, $stateParams) {
        this.$uibModal = $uibModal;
        this.$stateParams = $stateParams;
        this.modalInstance = null;
    }

    open() {
        if(!this.$stateParams.dashboardId) return;

        // If there is already modal active we need to close it before opening new one
        this.modalInstance && this.modalInstance.dismiss();

        this.modalInstance = this.$uibModal.open({
            templateUrl: 'content/dashboard/customise.html',
            size: 'lg',
            controllerAs: 'modal',
            bindToController: true,
            controller: CustomiseDashboardModalCtrl,
            resolve: {
                dashboardId: () => this.$stateParams.dashboardId
            }
        });
    }
}

truedashApp.service('CustomiseDashboardModalService', CustomiseDashboardModalService);
