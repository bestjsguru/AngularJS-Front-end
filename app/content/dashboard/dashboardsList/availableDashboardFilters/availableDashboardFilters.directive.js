'use strict';

import {RangeModel} from "../../../common/models/range.model";

const DEFAULT_DATE_RANGE = 'year';

class AvailableDashboardFiltersController {
    constructor($uibModal, DashboardFiltersService, $rootScope, $q, DashboardFiltersFactory, $element,
                DashboardCollection, DeregisterService, $scope, $document, DataProvider, Auth, AppEventsService) {
        this.$uibModal = $uibModal;
        this.$q = $q;
        this.dashboardFiltersService = DashboardFiltersService;
        this.deregisterService = DeregisterService;
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.$element = $element;
        this.$document = $document;
        this.dashboardCollection = DashboardCollection;
        this.dashboardFiltersFactory = DashboardFiltersFactory;
        this.Auth = Auth;
        this.init();
    }

    init() {
        this.cardsLoadingSet = new Set();
        this.loading = false;
        this.isAppliedAtLeastOnce = false;
        this.itemsChanged = false;
        this.watchers = this.deregisterService.create(this.$scope);

        this.resetDatePicker();
    }

    loadInitialData() {
        // We trigger filter toggling from dashboards page so we have to assign reference
        this.tuDashboardsPage.availableDashboardFilters = this;

        this.currentDashId = this.tuDashboardsPage.currentDashId;
        if (this.currentDashId > 0) {
            this.loading = true;
            this.$q.all([
                this.dashboardFiltersService.listAllDashboardFilters(this.currentDashId),
                this.dashboardFiltersFactory.create({id: this.currentDashId}).getAvailableDataSources(true)
            ]).then(resultList => {
                this.loadDashboardFiltersFromServer(resultList);
            }).finally(() => {
                this.loading = false;
            });
        }
    }

    $onInit() {

        this.watchers.onRoot('card.directive.created', (event, cardId) => {
            this.updateCardDirectiveMap(cardId);
        });
        this.watchers.onRoot('dashboardModel.loadCards.completed', () => {
            this.isCardInfoLoaded = true;
            this.autoApplyDashboardFilters();
        });

        this.watchers.onRoot('dashboardFilters.update', (event, model) => {
            if (!this.loading) {
                this.init();
                this.loadInitialData();
            }
        });

        this.watchers.onRoot('dashboardFilters.filtersChanged', () => {
            this.updateCards(false);
        });

        this.loadInitialData();
    }
    
    get cardsAreLoading() {
        let currentDashboard = this.getCurrentDashboard();
        
        if (currentDashboard) {
            return currentDashboard.cards.filter(card => card.metricsAreLoading() && card.active).length > 0;
        }
        
        return true;
    }

    updateCardDirectiveMap(cardId) {
        let currentDashboard = this.getCurrentDashboard();
        this.cardsLoadingSet.add(cardId);
        if (this.cardsLoadingSet.size === currentDashboard.cards.length) {
            this.cardsLoadingSet.clear();
            this.isAllCardDirectiveCreated = true;
            this.autoApplyDashboardFilters();
        }
    }

    autoApplyDashboardFilters() {
        if (this.isAllCardDirectiveCreated && this.isCardInfoLoaded && window.Location.isExport) {
            // this.updateCards();
        }
    }

    findDateFilter(dashboardFiltersFromServer) {
        return dashboardFiltersFromServer.find(item => item.type === 'date' && item.name === 'Date');
    }

    loadDashboardFiltersFromServer([dashboardFiltersFromServer, sources]) {
        this.dataSources = sources;
        this.dateFilter = this.tuDashboardsPage.currentDateFilter = this.findDateFilter(dashboardFiltersFromServer);
        let fieldDashboardFilters = dashboardFiltersFromServer.filter(item => item.type !== 'date');
        if (!this.dateFilter) {

            let dateFilterModel = {
                dashboardId: this.currentDashId,
                fromDays: 0,
                isActive: false,
                isRange: true,
                name: "Date",
                operator: "eq",
                toDays: 0,
                type: "date",
                rangeName: DEFAULT_DATE_RANGE
            };

            this.dashboardFiltersService.saveDashboardFilter([dateFilterModel]).then(result => {
                this.dateFilter = this.tuDashboardsPage.currentDateFilter = this.findDateFilter(result);
                this.restoreFromDashboardFilters(fieldDashboardFilters);
            });

        } else {
            this.restoreFromDashboardFilters(fieldDashboardFilters);
        }
    }

    restoreFromDashboardFilters(dashboardFiltersFromServer) {
        let filter = this.dateFilter;
        this.dates = {
            startDate: moment().subtract(filter.fromDays ? filter.fromDays : 0, "days").hours(0).minutes(0).seconds(0),
            endDate: moment().subtract(filter.toDays ? filter.toDays : 0, "days").hours(23).minutes(59).seconds(59)
        };
        this.customDateMap = new RangeModel({from:filter.fromDays, to: filter.toDays});
        this.range = filter.rangeName ? filter.rangeName : DEFAULT_DATE_RANGE;

        this.dashboardFilters = this.tuDashboardsPage.currentDashboardFilters = dashboardFiltersFromServer;

        this.dashboardFilters.forEach(dashboardFilterItem => {
            this.restoreSingleFilter(dashboardFilterItem);
        });
        this.initialNumberOfActiveFilters = this.getNumberOfActiveFilters();
        this.checkForActiveDashboardFiltersWithValues();
    }

    getNumberOfActiveFilters() {
        return this.dashboardFilters.filter(item => item.isActive).length;
    }

    checkForActiveDashboardFiltersWithValues() {
        if (this.hasActiveDashboardFilters()) {
            this.$document.find('html').addClass('dashboard-filters');
            this.autoApplyDashboardFilters();
        }
    }

    hasActiveDashboardFilters() {
        let hasActiveFilters = this.dashboardFilters && this.getNumberOfActiveFilters() > 0;
        return hasActiveFilters || (this.dateFilter && this.dateFilter.isActive);
    }

    restoreSingleFilter(filter) {
        let dataSource = this.dataSources.find(item => item.dataSourceId === filter.dataSourceId);
        let table = dataSource.tables.find(item => item.tableId === filter.tableId);
        let column = table.columns.find(item => item.id === filter.columnId);
        filter.tmp = {
            columnValues: [],
            column: column
        };
    }

    refreshDates(dates, range) {
        this.itemsChanged = true;
        this.dates = dates;
        this.dateFilter.rangeName = this.range = range;
        let from = moment().diff(dates.startDate, 'days');
        let to = moment().diff(dates.endDate, 'days') + 1;
        this.dateFilter.fromDays = from > 0 ? from : 0;
        this.dateFilter.toDays = to > 0 ? to : 0;
        let difference = this.dateFilter.fromDays - this.dateFilter.toDays;
        this.isCustomWeekRangeInvalid = !!(range === 'customWeek' && difference < 6);

        if (range !== 'customDate') {
            this.$element.find('.dropdown').removeClass('open');
        }

        this.dateFilter.isActive = true;
    }

    getRangeName() {
        if (this.dateFilter) {
            if (!this.dateFilter.isActive) {
                return ' ';
            }
            // for old dataFilter model that has 'value' field but does not have 'rangeName' field
            if (!this.dateFilter.rangeName) {
                this.dateFilter.rangeName = this.dateFilter.value ? this.dateFilter.value : DEFAULT_DATE_RANGE;
            }
            return this.dateFilter.rangeName;
        }
        return null;
    }

    openModal(index, filter) {
        if (this.isOwnerOrAdmin(filter)) {
            this.dashboardFiltersService.openModal(_.clone(filter), this.dashboardFilters, this.dateFilter);
        }

    }

    getCurrentDashboard() {
        return _.get(this.tuDashboardsPage, 'dashboards') && this.tuDashboardsPage.dashboards.find(item => item.id === +this.currentDashId);
    }

    updateCards(isCanceled = false) {
        let currentDashboard = this.getCurrentDashboard();
        if (currentDashboard) {
            let dashboardFiltersList = this.dashboardFilters;
            dashboardFiltersList.forEach(item => {
                item.value = item.tmp.columnValues ? item.tmp.columnValues : [];
            });
            this.loading = true;

            let model = {};
            if (this.dateFilter.isActive) {
                model.dates = this.dates;
                model.range = this.range;
            } else {
                this.dateFilter.value = undefined;
                this.dateFilter.rangeName = undefined;
            }

            this.$q.all([
                this.dashboardFiltersFactory.create({id: this.currentDashId}).getAvailableDataSourcesByCard(true),
                this.dashboardFiltersService.saveDashboardFilter([this.dateFilter, ...dashboardFiltersList])])
                .then(([fullSources, dashboardFiltersFromServer]) => {
                    this.initialNumberOfActiveFilters = this.getNumberOfActiveFilters();
                    this.isAppliedAtLeastOnce = true;
                    this.itemsChanged = false;
                    if (isCanceled) {
                        this.$rootScope.$emit('dashboard.restoreOriginalCardData');
                    } else {
                        model.activeCardColumnsMap = this.dashboardFiltersService.getAffectedCardColumns(currentDashboard.cards, fullSources, dashboardFiltersList);
                        this.$rootScope.$emit('dashboardFilters.refreshCards', model);
                    }
                })
                .finally(() => {
                    this.loading = false;

                    this.AppEventsService.track('used-dashboard-filters', {dashboard_id: this.currentDashId});
                });
        }
    }

    isApplyButtonShown() {
        if (!this.dashboardFilters) return false;
        if (this.isAppliedAtLeastOnce) {
            return this.itemsChanged || this.initialNumberOfActiveFilters !== this.getNumberOfActiveFilters();
        }
        return true;
    }

    filterChanged() {
        this.itemsChanged = true;
    }

    resetFilters() {
        this.dashboardFilters.forEach(item => {
            item.tmp.columnValues = [];
        });

        this.resetDatePicker();
        this.dateFilter.fromDays = 0;
        this.dateFilter.toDays = 0;
        this.dateFilter.rangeName = this.range;
        this.updateCards(true);
    }

    clearFilter(filter) {
        filter.tmp.columnValues = [];
        this.updateCards(false);
    }

    resetDatePicker() {
        this.dates = {
            startDate: moment().hours(0).minutes(0).seconds(0),
            endDate: moment().hours(23).minutes(59).seconds(59)
        };
        this.range = ' ';
    }

    get isPPT() {
        return window.Location.isPPT;
    }

    isAdmin() {
        return this.Auth.user.isAdmin();
    }

    isOwnerOrAdmin(filter) {
        return this.isAdmin() || filter.userRole.userId === this.Auth.user.id;
    }
}

truedashApp.directive('tuAvailableDashboardFilters', () => {
    return {
        require: {
            tuDashboardsPage: '^?tuDashboardsPage'
        },
        controller: AvailableDashboardFiltersController,
        bindToController: true,
        controllerAs: 'adf',
        restrict: 'A',
        scope: true,
        templateUrl: 'content/dashboard/dashboardsList/availableDashboardFilters/availableDashboardFilters.html'
    };
});
