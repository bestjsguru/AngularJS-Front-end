import {Collection} from '../../data/collection.js';

export class DashboardFilters extends Collection {
    constructor(dashboard, DataProvider, ColumnEntityModel) {
        super();
        this.dashboard = dashboard;
        this.DataProvider = DataProvider;
        this.ColumnEntity = ColumnEntityModel;
    }

    getDataSources(useCache = false) {
        return this.DataProvider.get('dashboard/getDashboardDataSources', { dashboardId: this.dashboard.id }, useCache);
    }

    getAvailableDataSources(useCache = false) {
        return this.getDataSources(useCache).then(sources => this.transformToDataSources(sources));
    }

    getAvailableDataSourcesByCard(useCache = false) {
        return this.getDataSources(useCache).then(sources => this.transformToDataSourcesByCards(sources));
    }

    transformToDataSourcesByCards(data) {
        const sources = JSON.parse(JSON.stringify(data));
        sources.forEach(source => {
            source.dataSources = this.mergeItems(source.dataSources, 'dataSourceId', 'tables');
            this.mergeDataSourceTables(source.dataSources, false);
        });
        return sources;
    }

    transformToDataSources(data) {
        const sources = JSON.parse(JSON.stringify(data));
        let dataSources = [];
        sources.forEach(source => {
            dataSources = dataSources.concat(source.dataSources);
        });

        dataSources = this.mergeItems(dataSources, 'dataSourceId', 'tables');
        this.mergeDataSourceTables(dataSources, true);

        return dataSources;
    }

    mergeDataSourceTables(dataSources, merge = true) {
        dataSources.forEach(source => {
            if(merge) {
                source.tables = this.mergeItems(source.tables, 'tableId', 'columns');
            }
            
            source.tables.forEach(table => {
                if(merge) {
                    table.columns = this.mergeItems(table.columns, 'columnId');
                }
                
                table.columns = table.columns.map(column => {
                    if(column instanceof this.ColumnEntity) return column;
                    
                    return new this.ColumnEntity({name: column.columnName, id: column.columnId, type: 'number'}, this.DataProvider);
                });
            });
        });
    }

    mergeItems(data, type, subType) {
        let merged = [];
        data.forEach(source => {
            let match = merged.find(item => item[type] === source[type]);
            if (!match) {
                merged.push(source);
            } else if (subType) {
                match[subType] = match[subType].concat(source[subType]);
            }
        });
        return merged;
    }
}

truedashApp.factory('DashboardFiltersFactory', (DataProvider, ColumnEntityModel) => {
    return {
        create: (dashboard) => new DashboardFilters(dashboard, DataProvider, ColumnEntityModel)
    };
});
