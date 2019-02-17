'use strict';

import {Config} from "../config";
import './explain/explainCardModal.directive';
import './highchart/highchart.component';
import './dashboardName/cardDashboardName.component';
import './expand/expandCard.component';
import './dexi/dexiCard.component';

class CardController {

    constructor($rootScope, $scope, $window, $element, $state, DataExportService, toaster, DeregisterService, $uibModal,
                CardFullInfoLoadingService, CardCacheHelperService, FavouriteDashboardService, $q, $confirm) {
        this.$q = $q;
        this.toaster = toaster;
        this.$element = $element;
        this.$confirm = $confirm;
        this.$uibModal = $uibModal;
        this.$rootScope = $rootScope;
        this.$state = $state;
        this.$window = $window;
        this.DataExportService = DataExportService;
        this.DeregisterService = DeregisterService;
        this.FavouriteDashboardService = FavouriteDashboardService;
        this.CardFullInfoLoadingService = CardFullInfoLoadingService;
        this.CardCacheHelperService = CardCacheHelperService;
        this.watchers = this.DeregisterService.create($scope);

        this.error = false;
        this.baseUrl = Config.baseUrl;
        this.explore = $scope;
        this.isCardExportProcessing = false;
        this.favourite = false;

        this.configureZapierLink = Config.zapier.url;
    }

    $onInit() {
        this.permissions = angular.copy(this.permissions);

        this.CardFullInfoLoadingService.check(this.card).then(() => {
            this.load();
        }).catch(() => {
            this.card.loadFullInfo().then(() => this.load());
        });

        var elementHolder = this.$element.find('div.dropdown.pull-right').first();
        elementHolder.find('.dropdown-toggle').dropdown();
        elementHolder.on('shown.bs.dropdown', () => {
            var dropdownMenu = this.$element.find('ul.dropdown-menu');
            dropdownMenu.removeClass('offscreen-menu');

            var fold = $(window).height() + $(window).scrollTop();
            if (fold <= $(dropdownMenu).offset().top + $(dropdownMenu).height() &&
                $(dropdownMenu).height() < $(dropdownMenu).offset().top - $(window).scrollTop()) {
                dropdownMenu.addClass('offscreen-menu');
            }
        });

        var body = $('body');

        this.bringToFront = (bool) => {
            // TODO This is now handled with css so we should remove it?
            //bool && this.$element.css('z-index', '3');
            //!bool && this.$element.css('z-index', '0');
            !bool && this.$element.find('[data-toggle="dropdown"]').parent().removeClass('open');
        };

        this.transformFooterElements = () => {
            var footer = this.$element.find('.card-footer');
            var pagination = this.$element.find('.pagination');
            var paginationWrapper = pagination.parents('.card-pagination-wrapper');

            if(!pagination.width()) {
                // Remove pagination element
                paginationWrapper.addClass('no-pagination');
            } else if (this.$element.width() < 345) {
                // This is minimal width in order to render pagination normally
                // so if card is smaller we have to some transformations
                paginationWrapper.addClass('small-card');
                paginationWrapper.removeClass('no-pagination');
            } else {
                // Return back to normal :)
                paginationWrapper.removeClass('small-card no-pagination');
            }

            if (this.$element.width() < 345) {
                // This is minimal width in order to render footer normally
                // so if card is smaller we have to some transformations
                footer.addClass('small-card');
            } else {
                // Return back to normal :)
                footer.removeClass('small-card');
            }
        };

        this.watchers.timeout(() => this.transformFooterElements(), 500);

        this.watchers.onRoot('dashboard.updateCards', (event, dates, range) => {
            if(this.$element.is(':visible')) this.refreshDates(dates, range);
        });

        this.watchers.onRoot('dashboard.restoreOriginalCardData', () => this.restoreOriginalCardDatesAndReloadData());

        this.watchers.onRoot('dashboardFilters.refreshCards', (e, model) => {
            this.dashboardFiltersRefreshCards(model);
        });

        this.watchers.on('gridsterResizeEnd', (event, $element) => {
            if (!$element) return;
            if(this.$element[0] != $element.children(':first')[0] || !this.card.dashboard.isActive()) return;

            this.watchers.timeout(() => {
                this.$rootScope.$broadcast('resize');
                this.transformFooterElements();
            }, Config.animationSpeed * 1.1);
        });

        this.watchers.onRoot('card.exportStart', (event, data) => {
            if (data.cardId && data.cardId == this.card.id) this.isCardExportProcessing = true;
        });

        this.watchers.onRoot('card.exportProcessEnd', (event, data) => {
            if (data.cardId && data.cardId == this.card.id) this.isCardExportProcessing = false;
        });

        this.$rootScope.$emit('card.directive.created', this.card.id);

        this.watchers.onRoot('card.updated', (event, cardId) => {
            if(cardId === this.card.id) this.load();
        });
    }

    restoreOriginalCardDatesAndReloadData() {
        if(this.card.metricsAreLoading()) return;

        this.card.restoreOriginalCardData();
        this.card.cardUpdateModel = undefined;
        this.reload(false);
    }

    get isExport() {
        return window.Location.isExport;
    }

    load(useCache = true, cardUpdateModel = undefined) {
        this.error = false;

        return this.card.metrics.load(useCache, false, cardUpdateModel).catch(error => {
            this.error = true;
            console.warn(`Error during rendering card ${this.card.id}`);
            console.error(error);
        }).finally(() => {
            this.CardFullInfoLoadingService.check(this.card).catch(angular.noop).finally(() => {
                this.activeDashboard = this.card.DashboardCollection.getActiveDashboard();
                this.card.initPositioning(this.gridsterItem);
                this.updateFavouriteStatus();
            });
        });
    }

    updateFavouriteStatus() {
        this.FavouriteDashboardService.load().then((favouriteDashboard) => {
            this.favouriteDashboard = favouriteDashboard;

            if (this.favouriteDashboard) {
                this.favouriteDashboard.cards.api().then((favouriteCards) => {
                    let find = favouriteCards.find(item => item.id === this.card.id);
                    this.favourite = find ? true : false;
                });
            }
        });
    }

    getTargetDashboardId() {
        if (this.card.dashboard) {
            return this.card.dashboard.isFavourite ? null : this.card.dashboard.id;
        }

        return null;
    }

    isOnFavouriteDashboard() {
        return this.favouriteDashboard && this.favouriteDashboard.id === this.card.dashboard.id;
    }

    reload(useCache = true, cardUpdateModel = undefined) {
        this.load(useCache, cardUpdateModel).then(() =>
            this.watchers.timeout(() => this.transformFooterElements(), 10)
        ).then(() => {
            this.card.dataUpdated = new Date().getTime();
        });
    }

    isError() {
        return this.error || this.card.metrics.error;
    }

    refreshDates(dates, range) {
        this.invalidate();
        this.card.updateDates(dates, range).then(() => this.reload());
    }

    refreshDatesForDashboardFilters(cardUpdateModel) {
        this.invalidate();
        this.card.updateDatesForDashboardFilters(cardUpdateModel.dates, cardUpdateModel.range);
        this.reload(false, cardUpdateModel);
    }

    getType() {
        return this.card.types.subType;
    }

    editCard() {
        if(this.card.isText()) {
            this.$state.go('editTextCard', { cardId: this.card.id });
        } else {
            this.$state.go('cardBuilder', { cardId: this.card.id });
        }
    }

    hide() {
        this.card.active = false;

        this.card.dashboard.cards.setCardStatus(this.card, false).then(() => {
            this.CardCacheHelperService.setCard(this.favouriteDashboard, this.card);

            this.toaster.success('Card "' + this.card.getName() + '" deactivated');
        });
    }

    delete() {
        return this.$confirm({
            title: 'Delete Card',
            text: `Are you sure you want to delete <strong>${this.card.getName()}</strong>? This change cannot be undone.`,
            ok: 'Delete',
            cancel: 'Cancel'
        }).then(() => {
            let promise = this.$q.when(true);

            if (this.favourite) {
                promise = this.toggleFavouriteStatus();
            }

            promise.then(() => this.deleteCard());
        });
    }

    deleteCard() {
        this.card.remove().then(() => {
            this.$rootScope.$emit('dashboardFilters.update');
            this.CardCacheHelperService.resetMetricUsageCache(this.card.metricIds());
            this.toaster.success('Card "' + this.card.getName() + '" deleted');
        }).catch(() => {
            this.toaster.error('Error deleting card "' + this.card.getName() + '"');
        }).finally(() => {
            this.invalidate();
        });
    }

    exportCard(type = 'csv') {
        if (!this.DataExportService.isExportProcessAlreadyLaunched(this.card.id)) {
            this.DataExportService.exportCard(type, this.card.clone(), this.card.cardUpdateModel);
        }
    }

    exportZap(info) {
        if (!this.DataExportService.isExportProcessAlreadyLaunched(this.card.id)) {
            this.DataExportService.exportZap(info, this.card.clone());
        }
    }

    download(type) {
        this.$rootScope.$emit('card.download.' + this.card.id, {
            type: type,
            title: this.card.getName(),
            subtitle: this.card.getDateRangeString(),
            timezone: this.card.usedTimezoneString()
        });
    }

    popoverHtmlMessage() {
        if(this.card.isText()) return '';

        let lastUpdate = this.card.lastUpdateFormatted();
        let timezone = this.card.timezoneString() ? `<br><br><i class="fa fa-globe" aria-hidden="true"></i> ${this.card.timezoneString()}` : '';
        lastUpdate = lastUpdate ? `<br><br>${lastUpdate}` : '';

        let description = this.card.description ? `<br><br>${this.card.description}` : '';

        return `${this.card.getDateRangeString()}${timezone}${description}${lastUpdate}`;
    }

    toggleFavouriteStatus() {
        let promise = this.$q.when(true);

        if (this.favouriteDashboard && this.card) {
            if (this.favourite === true) {
                promise = this.FavouriteDashboardService.removeCard(this.card.id).then(() => {
                    return this.deleteFavouriteCard();
                });
            } else {
                promise = this.FavouriteDashboardService.addCard(this.card).then(positionId => {
                    return this.addFavouriteCard();
                });
            }
        }

        return promise;
    }

    deleteFavouriteCard() {
        this.favourite = !this.favourite;

        this.favouriteDashboard.cards.remove(this.card.id);

        this.toaster.success('Card "' + this.card.getName() + '" removed from home page');
    }

    addFavouriteCard() {
        this.favourite = !this.favourite;

        this.toaster.success('Card "' + this.card.getName() + '" added to home page');
    }

    isSQLBased() {
        if (this.card && this.card.metrics && this.card.metrics.get(0)) {
            return this.card.metrics.get(0).isSQLBased();
        }
    }

    dashboardFiltersRefreshCards(cardUpdateModel) {
        if (cardUpdateModel) {
            this.card.cardUpdateModel = cardUpdateModel;
            if (cardUpdateModel.range) {
                this.refreshDatesForDashboardFilters(cardUpdateModel);
            } else {
                this.reload(false, cardUpdateModel);
            }
        }
    }

    cardDashboardFilters() {
        return this.card.cardUpdateModel;
    }

    cardHolderStyle() {
        // we only want to show card image once loading is finished
        return !this.card.metricsAreLoading() ? this.card.image.cssStyle() : {};
    }

    expand() {
        this.modal && this.modal.dismiss();
        this.modal = this.$uibModal.open({
            component: 'appExpandCard',
            windowClass: 'expand-card-wrapper',
            backdrop: 'static',
            size: 'lg',
            resolve: {
                card: () => this.card
            }
        });
    }

    linkToDexi() {

    }

    processData(link) {
        this.modal && this.modal.dismiss();
        this.modal = this.$uibModal.open({
            component: 'appDexiCard',
            windowClass: 'dexi-card-wrapper',
            backdrop: 'static',
            size: 'lg',
            resolve: {
                card: () => this.card,
                link: () => link,
            }
        });
    }
}

truedashApp.directive('tuCard', () => {
    return {
        controller: CardController,
        templateUrl: 'content/card/card.html',
        bindToController: true,
        controllerAs: 'c',
        restrict: 'A',
        require: {
            gridsterItem: '^?gridsterItem'
        },
        scope: {
            card: '=tuCard',
            invalidate: '&',
            permissions: '<'
        }
    };
});
