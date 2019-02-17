
import {Card} from '../model/card.model';

export class VirtualCard extends Card {
    constructor(dashboard, cardData, CardCompareFactory, CardGroupingsFactory, CardFormulasFactory, CardFactory, CardMetricsFactory,
                CardFiltersFactory, CardTypesFactory, CardCacheHelperService, CardFrequenciesFactory, $q, DataProvider,
                CardPositioningFactory, AnnotationsFactory, Auth, UserService, CardCohortFactory, CardTableFactory, DateRangeService,
                $filter, CardDrillFactory, CardImageFactory, DashboardCollection, DashboardCacheHelperService, AppEventsService, AlertsFactory, $state) {

        super(dashboard, cardData, CardCompareFactory, CardGroupingsFactory, CardFormulasFactory, CardFactory, CardMetricsFactory,
            CardFiltersFactory, CardTypesFactory, CardCacheHelperService, CardFrequenciesFactory, $q, DataProvider,
            CardPositioningFactory, AnnotationsFactory, Auth, UserService, CardCohortFactory, CardTableFactory, DateRangeService,
            $filter, CardDrillFactory, CardImageFactory, DashboardCollection, DashboardCacheHelperService, AppEventsService, AlertsFactory, $state);

        this.virtualDataSetId = 1;
        this._virtualize();
    }

    _nextVirtualId() {
        return this.virtualDataSetId++;
    }

    _virtualize(){
        this.virtualizedFromId = this.id;
        this.id = null;
        var formulaIdsMap = [];

        //create virtual id's for all dataSets
        this.metrics.forEach(dataSet => dataSet.virtualId = this._nextVirtualId());

        let formulas = [];
        //create virtual id's for all formulas
        this.formulas.forEach(formula => {
            formula.data.virtualId = this._nextVirtualId();
            formulaIdsMap[formula.data.virtualId] = formula.data.id;
            formulas.push(formula);
        });

        this.metrics.removeAllFormulas();
        formulas.forEach(formula => this.metrics.addFormula(formula));

        //update comparedTo to virtual id's
        this.compare.getList().forEach(compare => {
            if (compare.info.comparedToFormula) {
                let formula = this.formulas.getById(compare.comparedTo);
                let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                compare.comparedTo = dataSet.virtualId;
            } else {
                let byRelationId = this.metrics.getByRelationId(compare.comparedTo);
                compare.comparedTo = byRelationId.virtualId;
                compare.relationId = byRelationId.relationId;
            }
        });

        //update id's in formulas to virtual id's
        var lettersMap = _.invert(this.formulas.getLettersJson());
        this.formulas.forEach((formula) => {
            formula.data.metrics = _.reduce(formula.data.metrics, (map, value, realId) => {
                let virtualId = lettersMap[formula.data.metrics[realId]] || this._nextVirtualId();
                map[virtualId] = formula.data.metrics[realId];
            }, {});
        });

        //updateFilters to use virtualId's
        this.filters.forEach(filter => {
            filter.dataSetId = this.metrics.find(dataSet => dataSet.isRegular() && dataSet.relationId == filter.metric).virtualId;
        });

        //update selectedTotals to use virtualId's
        this.selectedTotals = this.selectedTotals.map((id) => {
            var metric = this.metrics.getByCompareId(id) || this.metrics.getByRelationId(id);
            return metric.virtualId;
        });

        //update metricInfoMap to use virtualId's
        var infoMap = {};
        var columnsMap = {};
        this.metrics.forEach(metric => {
            var metricId = this.getMetricIdFromJson(metric, formulaIdsMap);

            var info = this.metrics.metricInfoMap[metricId];
            var column = this.metrics.columnsMap[metricId];

            if (info) {
                infoMap[metric.virtualId] = info;
                metric.subType = this.types.subType;
            }

            if (column) columnsMap[metric.virtualId] = column;
        });

        this.metrics.columnsMap = columnsMap;
        this.metrics.metricInfoMap = infoMap;

        this.metrics.trigger('loaded');
    }


    isVirtual() {
        return true;
    }
}
