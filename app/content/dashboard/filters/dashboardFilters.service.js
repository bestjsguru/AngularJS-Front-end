import {addDashboardFilterModalOptions} from "./addDashboardFilter.directive";

class DashboardFiltersService {
    constructor($q, DataProvider, Auth, $uibModal) {
        this.$q = $q;
        /** @type {DataProvider} **/
        this.DataProvider = DataProvider;
        /** @type {Auth} **/
        this.Auth = Auth;
        this.$uibModal = $uibModal;
    }

    listAllDashboardFilters(dashboardId, useCache = false) {
        return this.DataProvider.get("dashboardFilter/dashboardFilters", {dashboardId: dashboardId, organisationId: this.Auth.user.organisation.id}, useCache);
    }


    saveDashboardFilter(dashboardFiltersArray) {

        let models =  dashboardFiltersArray.map(item => _.clone(item));

        models.forEach(filter => {
            filter.organisationId = this.Auth.user.organisation.id;
            if (filter.tmp) {
                filter.tmp = undefined;
            }
        });

        return this.DataProvider.post("dashboardFilter/save", models);
    }

    deleteDashboardFilter(id) {
        return this.DataProvider.post("dashboardFilter/delete?id=" + id);
    }

    transformDataToDashboardFilterModel(dashboardId, rootFilter, originalFilterModel, subFilters) {

        let model = {
            columnId: rootFilter.column.id,
            dashboardId: dashboardId,
            dataSourceId: rootFilter.table.dataSourceId,
            isActive: _.isBoolean(rootFilter.isActive) ? rootFilter.isActive : true,
            isRange: false,
            name: rootFilter.filterName,
            operator: 'in',
            organisationId: this.Auth.user.organisation.id,
            tableId: rootFilter.table.tableId,
            type: 'field',
            value: []
        };

        if (originalFilterModel) {
            model.id = originalFilterModel.id;
            model.operator = originalFilterModel.operator;
            model.value = originalFilterModel.value ? originalFilterModel.value : [];
        }

        model.cardFilterList = subFilters ? subFilters.filter(subFilter => subFilter.enabled)
            .map(subFilter =>({
                card: subFilter.id,
                column: subFilter.selected.column.id,
                table: subFilter.selected.table.tableId,
                truedashDataSource: subFilter.selected.table.dataSourceId
            })) : [];

        return model;
    }

    saveDashboardFilterBy(dashboardId, rootFilter, subFilters = undefined) {
        let dashboardFilterModel = this.transformDataToDashboardFilterModel(dashboardId, rootFilter, null, subFilters);
        return this.saveDashboardFilter([dashboardFilterModel]);
    }

    updateDashboardFilterBy(dashboardId, rootFilter, originalFilterModel, subFilters = undefined) {
        let dashboardFilterModel = this.transformDataToDashboardFilterModel(dashboardId, rootFilter, originalFilterModel, subFilters);
        return this.saveDashboardFilter([dashboardFilterModel]);
    }

    openModal(selectedFilter, dashboardFilters, dateFilter) {

        this.modalInstance && this.modalInstance.dismiss();

        const options = addDashboardFilterModalOptions(selectedFilter, dashboardFilters, dateFilter);

        this.modalInstance = this.$uibModal.open(options);
    }

    getAffectedCardColumns(cards, sources, dashboardFilters) {
        const affectedCardsList = [];
        dashboardFilters.forEach(dFilter => {
            if (dFilter.isActive) {
                sources.forEach(dataSourceCard => {
                    const column = this.findColumnData(dFilter, dataSourceCard.dataSources || sources);
                    column && affectedCardsList.push({cardId: dataSourceCard.cardId, column: column});
                });
            }
        });

        const activeCardColumnsMap = {};

        const activeCards = cards.filter(c => c.rangeName);

        activeCards.forEach(activeCard => {
            const activeCardColumns = affectedCardsList.filter(c => c.cardId === activeCard.id).map(c => c.column);
            if (activeCardColumns.length > 0) {
                let item = activeCardColumnsMap[activeCard.id];
                if (item) {
                    activeCardColumnsMap[activeCard.id] = [...item, ...activeCardColumns];
                } else {
                    activeCardColumnsMap[activeCard.id] = activeCardColumns;
                }
            }

        });

        return activeCardColumnsMap;

    }

    findColumnData(serachCriteria, dataSources) {
        let column = null;
        dataSources.forEach(item => {
            let dataSourceIdMatch = item.dataSourceId === serachCriteria.dataSourceId;
            if (dataSourceIdMatch) {
                let tableMatch = item.tables.find(table => table.tableId === serachCriteria.tableId);
                if (tableMatch) {
                    column = tableMatch.columns.find(column => column.id === serachCriteria.columnId);
                }
            }
        });
        return column;
    }

}

truedashApp.service('DashboardFiltersService', DashboardFiltersService);
