'use strict';

import {ColumnHelper} from '../../../card/datatable/column.helper.js';
import {MetricDataHelper} from '../../../metricBuilder/metricData/metricData.helper.js';
import ConvertFilter from '../../../builder/filters/convertFilter';

class ExplainCardDefinitionCtrl {
    constructor(MetricDataService, $q) {
        this.$q = $q;
        this.MetricDataService = MetricDataService;
        this.ConvertFilter = new ConvertFilter();
    }

    $onInit() {
        this.metrics = this.card.metrics.items.filter(metric => !metric.formulaId).map((metric) => {
            return {
                id: metric.rawId,
                name: metric.label,
                original: {
                    table: !metric.isSQLBased() && metric.table,
                    statement: metric.statement
                }
            };
        });
    
        this.metrics.forEach(metric => {
            if(metric.original.table) {
                this.getTableDetails(metric.original.table).then((table) => {
                    metric.table = table.name;
                    
                    this.addTableNamesToColumns(metric).then(columns => {
                        metric.statement = MetricDataHelper.convertStatementFromServer(metric.original.statement, columns);
                    });
                });
            }
            
            this.getFilters(metric).then((filters) => {
                metric.filters = filters;
            });
        });

    }

    getFilters(metric) {
        return this.MetricDataService.getFilters(metric.id);
    }

    getTableDetails(tableId) {
        return this.MetricDataService.loadOrganisationTables(true)
            .then(tables => tables.find(table => table.id === tableId));
    }

    addTableNamesToColumns(metric) {
        let promises = [
            this.MetricDataService.loadAllTableColumns(metric.original.table, metric.id),
            this.MetricDataService.loadOrganisationTables(true)
        ];
        
        return this.$q.all(promises).then(([columns, tables]) => {
            ColumnHelper.assignTablesToColumns(columns, tables);
            
            return columns;
        });
    }
    
    convertToText(filter) {
        return this.ConvertFilter.toText(filter);
    }
}

truedashApp.component('appExplainCardDefinition', {
    controller: ExplainCardDefinitionCtrl,
    templateUrl: 'content/card/explain/definition/explainCardDefinition.html',
    bindings: {
        card: '='
    }
});
