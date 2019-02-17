import {FiltersOperatorModel} from "../../common/filters/filters.operators.model";
import {FilterFormModel} from "../../common/filterForm.model";
import {DASHBOARD_FILTER_MODEL_TYPES} from "../../common/filters/filters.module";
import {Config} from "../../config.js";

export class AddDashboardFilterModalController {
    constructor(DashboardCollection, $uibModalInstance, DashboardFiltersService, selectedFilter,
                $rootScope, dashboardFilters, dateFilter, Auth, $document, $q, $timeout) {
        /** @type {DashboardCollection} **/
        this.dashboardCollection = DashboardCollection;
        this.$uibModalInstance = $uibModalInstance;

        /** @type {DashboardFiltersService} **/
        this.dashboardFiltersService = DashboardFiltersService;
        this.selectedFilter = selectedFilter;
        this.$rootScope = $rootScope;
        this.$document = $document;
        this.$timeout = $timeout;
        this.dashboardFilters = dashboardFilters;
        this.dashboardFilterTypes = DASHBOARD_FILTER_MODEL_TYPES;

        /** @type {Auth} **/
        this.Auth = Auth;
        this.selected = {startDate: {}, endDate: {}};
        this.loading = false;
        this.selected.dateData = {};
        this.filter = new FilterFormModel();
        this.operators = new FiltersOperatorModel();
        this.dateFilter = dateFilter;
        this.$q = $q;
        this.filtersChanged = false;
        this.init();
    }

    init() {
        if (this.selectedFilter && !this.selected.dashboardFilterType) {
            // if restore filter - define dashboardFilterType and set active status
            this.selected.dashboardFilterType = {
                label: this.selectedFilter.type
            };

            this.selected.isActive = this.selectedFilter.isActive ? this.selectedFilter.isActive : false;
        }

        if (!this.selectedFilter && !this.selected.dashboardFilterType) {
            // if filter is new set active status to true
            this.selected.isActive = true;
            // set default dashboardFilterType
            this.selected.dashboardFilterType = this.dashboardFilterTypes[0];
        }
        this.initDashboardFilterOfTypeField();
    }

    initDashboardFilterOfTypeField() {

        this.dashboard = this.dashboardCollection.getActiveDashboard();
        this.cards = this.dashboard.cards;
        this.dataSources = [];
        this.affectedCardsList = [];
        this.submitted = false;
        this.loading = false;

        this.dashboard.filters.getDataSources()
            .then(dataSources => {
                this.dataSources = this.dashboard.filters.transformToDataSources(dataSources);
                this.dataSourcesByCard = this.dashboard.filters.transformToDataSourcesByCards(dataSources);

                if (this.selectedFilter) {
                    this.restoreFromSelectedFilter();
                    if (_.isArray(this.selectedFilter.cardFilterList)) {
                        this.restoreCardsFromSelectedFilter();
                    } else {
                        this.updateCardsList();
                    }
                }

            }).finally(() => {
            this.$timeout(() => {
                this.$document.find('.card-filters-holder').perfectScrollbar('update');
            });
        });
    }

    onFilterSettingUpdated(type) {
        type === 'table' && this.resetColumnSelect();
        this.affectedCardsList.length = 0;
        this.updateCardsList();
    }

    updateCardsList() {
        if (!this.selected.column || !this.selected.column.id) return;
        this.dataSourcesByCard.forEach(dataSourceCard => {
            let match = this.findColumn(undefined, dataSourceCard.dataSources);
            match && this.affectedCardsList.push({name: dataSourceCard.name, id: dataSourceCard.cardId, match: true});
        });

        this.cards.forEach(card => {
            card.enabled = false;
            card.selected = undefined;
        });

        this.affectedCardsList.forEach(affectedCard => {
            let card = this.cards.find(card => affectedCard.id === card.id);
            if (card) {
                card.enabled = true;
                card.selected = _.clone(this.selected);
            }
        });

    }

    findColumn(serachCriteria = this.selected, dataSources = this.dataSources) {
        return dataSources.find(item => {
            let dataSourceIdMatch = serachCriteria.dataSource ? item.dataSourceId === serachCriteria.dataSource.dataSourceId  : item.dataSourceId === serachCriteria.table.dataSourceId;
            if (!dataSourceIdMatch) return false;
            let tableMatch = item.tables.find(table => table.tableId === serachCriteria.table.tableId);
            if (!tableMatch) return false;
            return tableMatch.columns.find(column => column.id === serachCriteria.column.id);
        });
    }

    resetColumnSelect() {
        this.selected.column = undefined;
    }

    onFilterSettingUpdatedForCardBy(card, type) {
        if (type === 'table') {
            card.selected.column = undefined;
        }
    }

    restoreSingleFilter([dashboardFilterItem]) {
        let filter = dashboardFilterItem;
        let dataSource = this.dataSources.find(item => item.dataSourceId === filter.dataSourceId);
        let table = dataSource.tables.find(item => item.tableId === filter.tableId);
        let column = table.columns.find(item => item.id === filter.columnId);
        dashboardFilterItem.tmp = {
            columnValues: [],
            column: column
        };
    }

    save() {
        this.submitted = true;
        this.loading = true;
        
        const promise = this.selectedFilter ? this.dashboardFiltersService.updateDashboardFilterBy(
            this.selectedFilter.dashboardId,
            this.selected,
            this.selectedFilter,
            this.cards.items) : this.dashboardFiltersService.saveDashboardFilterBy(this.dashboard.id, this.selected, this.cards.items);
    
        promise.then(result => {
            this.restoreSingleFilter(result);
            
            let updatedIndex = _.findIndex(this.dashboardFilters, {id: result[0].id});
    
            if (updatedIndex >= 0) {
                this.dashboardFilters.splice(updatedIndex, 1, result[0]);
            } else {
                this.dashboardFilters.push(result[0]);
            }
        }).finally(() => this.releaseButtons());
    }

    releaseButtons() {
        this.form.$setPristine(true);
        this.submitted = false;
        this.loading = false;
    }

    cancel() {
        if(this.filtersChanged) {
            this.$rootScope.$emit('dashboardFilters.filtersChanged');
        }
        this.$uibModalInstance.dismiss('cancel');
    }

    dirty(field) {
        return this.submitted || field && field.$dirty;
    }

    restoreFromSelectedFilter() {
        this.selected.filterName = this.selectedFilter.name;
        let filter = this.selectedFilter;

        if (filter) {
            this.selected.dataSource = this.dataSources.find(item => item.dataSourceId === filter.dataSourceId);

            if (this.selected.dataSource) {
                this.selected.table = this.selected.dataSource.tables.find(item => item.tableId === filter.tableId);

                if (this.selected.table) {
                    this.selected.column = this.selected.table.columns.find(item => item.id === filter.columnId);
                }
            }
        }
    }

    restoreCardsFromSelectedFilter() {

        this.updateCardsList();

        this.cards.forEach(card => {
            card.enabled = false;
        });

        this.selectedFilter.cardFilterList.forEach(cardFilterDataFromServer => {
            const card = this.cards.find(card => cardFilterDataFromServer.card === card.id);
            if (card) {
                card.enabled = true;
                const table = this.cardTables(card).find(item => item.tableId === cardFilterDataFromServer.table);
                if (table) {
                    card.selected = {
                        table: table,
                        column: table.columns.find(item => item.id === cardFilterDataFromServer.column)
                    };
                }
            }
        });

    }

    removeDashboardFilter(index, filter) {
        this.loading = true;
        this.dashboardFiltersService.deleteDashboardFilter(filter.id).then(() => {
            this.dashboardFilters.splice(index, 1);
            this.loading = false;
        });
    }

    editSelectedFilter(index, filter) {
        if (this.isOwnerOrAdmin(filter)) {
            this.selectedFilter = _.clone(filter);
            this.selected.dashboardFilterType = undefined;
            this.init();
        }
    }

    newFilter() {
        this.selectedFilter = undefined;
        this.selected = {};
        this.init();
        this.form.$setPristine();
    }

    onToggleFilter(index, filter) {
        this.filtersChanged = true;
        this.loading = true;
        let model = _.clone(filter);
        model.tmp = undefined;
        model.isActive = !model.isActive;
        this.dashboardFiltersService.saveDashboardFilter([model]).then(result => {
            this.restoreSingleFilter(result);
            this.dashboardFilters.splice(index, 1, result[0]);
            this.onToggleSelectedFilter(result[0]);
        }).finally(()=> {
            this.loading = false;
        });
    }

    onToggleSelectedFilter(filterModelFromServer) {
        if(this.selectedFilter && this.selectedFilter.id === filterModelFromServer.id) {
            this.selected.isActive = filterModelFromServer.isActive;
        }
    }
    
    toggleSelectedFilterStatus() {
        this.selected.isActive = !this.selected.isActive;
    
        this.form.$setDirty();
    }

    isFilterActive(filter) {
        return this.selectedFilter ? filter.id === this.selectedFilter.id : false;
    }

    toggleDateFilter() {
        this.loading = true;
        let model = _.clone(this.dateFilter);
        model.isActive = !model.isActive;
        this.dashboardFiltersService.saveDashboardFilter([model]).then(() => {
            this.dateFilter.isActive = !this.dateFilter.isActive;
            this.loading = false;
        });
    }


    getSubFilterFieldColumns(table) {
        const columns = this.getFieldColumns(table);
        return columns.filter(column => column.name === this.selected.column.name);
    }

    getFieldColumns(table) {
        if (table && table.columns) {
            return table.columns
                .filter(c => !c.isDate)
                .filter(c => c.type === 'number' && c.name.indexOf('date') === -1 && c.name.indexOf('hour') === -1);
        }
        return [];

    }

    isAdmin() {
        return this.Auth.user.isAdmin();
    }

    isOwnerOrAdmin(filter) {
        return this.isAdmin() || filter.userRole.userId === this.Auth.user.id;
    }

    selectedDataSourceTables(dataSources = this.dataSources) {
        return [].concat.apply([], dataSources
            .map(dataSource => dataSource.tables.map(table => {
                table.dataSourceId = dataSource.dataSourceId;
                table.dataSourceName = dataSource.dataSourceName;
                return table;
            })));
    }

    cardTables(card) {
        const dataSourcesByCardItem = this.dataSourcesByCard.find(dataSourcesByCardItem => dataSourcesByCardItem.cardId === card.id);
        return this.selectedDataSourceTables(dataSourcesByCardItem.dataSources);
    }

    hasColumnName(card) {
        if(!this.selected.column) return false;

        return this.cardTables(card).find(table => table.columns.find(column => column.name === this.selected.column.name));
    }

    toggleCard(card) {
        card.enabled = !card.enabled;
        
        this.form.$setDirty();
    }
}

export const addDashboardFilterModalOptions = (selectedFilter, dashboardFilters, dateFilter) => {
    return {
        controller: AddDashboardFilterModalController,
        templateUrl: 'content/dashboard/filters/addFilter.html',
        bindToController: true,
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
            selectedFilter: () => selectedFilter,
            dashboardFilters: () => dashboardFilters,
            dateFilter: () => dateFilter
        }
    };
};
