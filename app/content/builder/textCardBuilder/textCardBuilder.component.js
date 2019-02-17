'use strict';

import {CardChangeObserver} from '../../../content/card/model/card.changeObserver';

class TextCardBuilderController {
    constructor(DashboardCollection, DashboardFolderService, DeregisterService, $scope, toaster, $stateParams, $q, CardFactory, $state) {
        this.DashboardCollection = DashboardCollection;
        this.DashboardFolderService = DashboardFolderService;
        this.CardFactory = CardFactory;
        this.toaster = toaster;
        this.$q = $q;
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.watchers = DeregisterService.create($scope);
        this.$cardChangeObserver = new CardChangeObserver();

        this.loading = {
            page: false,
            saving: false
        };
        this.userDashboards = [];

        this.card = null;
    }

    $onInit() {
        this.preload();
    }

    preload() {
        this.loading.page = true;
        const cardId = this.$stateParams.cardId;

        this.loadUserDashboards().then(dashboards => {
            this.userDashboards = dashboards;
        }).then(() => {
            if (cardId) {
                this.loadTextCard(cardId).then(card => {
                    this.card = card.clone();
                    this.card.text = _.unescape(this.card.text);
                    this.card.loadDataFromCache = true;
                });
            } else {
                const dashboardId = this.$stateParams.dashboardId;
                if (dashboardId) {
                    const cardDashboard = this.userDashboards.find(dashboard => dashboard.id == dashboardId);
                    this.card = this.CardFactory.create(cardDashboard);
                } else {
                    this.card = this.CardFactory.create(
                        this.userDashboards[0]
                    );
                }

                this.card.types.type = 'text';
                this.card.types.subType = 'text';
            }
        }).catch(e => {
            console.error(e);
            this.toaster.error('Error occurred, please try later');
        }).finally(() => {
            this.loading.page = false;
        });
    }

    loadUserDashboards() {
        let promises = [this.DashboardCollection.loadUserDashboards(), this.DashboardFolderService.load()];
        
        return this.$q.all(promises).then(([dashboards, folders]) => {
            return dashboards.filter(dash => dash.isOwner()).map(dash => {
                return {
                    id: dash.id,
                    name: dash.name,
                    cards: dash.cards,
                    folderName: dash.inFolder ? folders.getById(dash.inFolder).title : '',
                    isOrganisationDashboard: () => dash.isOrganisationDashboard(),
                    reachedCardsLimit: dash.reachedCardsLimit,
                    useTimezone: dash.useTimezone,
                    timezoneString: () => dash.timezoneString(),
                    usedStartDayOfWeek: dash.usedStartDayOfWeek
                };
            });
        });
    }

    loadTextCard(cardId) {
        return this.DashboardCollection.loadByCardId(cardId).then(dashboard => {
            return dashboard.cards.loadCards();
        }).then(() => {
            return this.DashboardCollection.findCard(cardId);
        });
    }

    save(shouldExit) {
        this.loading.saving = true;

        this.card.save().then(() => {
            this.$cardChangeObserver.observe(this.card);
            this.toaster.success('Card saved');
            if (shouldExit) {
                this.exit();
            } else {
                this.$state.go(
                    'editTextCard',
                    { cardId: this.card.id },
                    { notify: false }
                );
            }
        }).catch(error => {
            this.toaster.error(error.message);
        }).finally(() => {
            this.loading.saving = false;
        });
    }

    exit() {
        if(!this.card) return;
        
        this.$state.go('dashboard', {
            dashboardId: this.card.dashboard.id
        });
    }
}

truedashApp.component('appTextCardBuilder', {
    controller: TextCardBuilderController,
    templateUrl: 'content/builder/textCardBuilder/textCardBuilder.html'
});
