'use strict';

import {MetricCollection} from "./metric.collection.js";
import {MetricModel} from "./metric.model.js";
import {Helpers} from "../../common/helpers";

const MAX_METRIC_DATA_LENGTH = 2000;

class CardMetrics extends MetricCollection {
    constructor(card, DataProvider, $q, DateRangeService, Auth, UserService, CardFullInfoLoadingService, CardCacheHelperService) {
        super(DataProvider, DateRangeService, Auth, UserService);
        /** @type {Card} */
        this.card = card;

        this.$q = $q;
        this.Auth = Auth;
        this.UserService = UserService;
        this.DateRangeService = DateRangeService;
        this.CardFullInfoLoadingService = CardFullInfoLoadingService;
        this.CardCacheHelperService = CardCacheHelperService;

        this.stats = {};
        this.tableTotals = [];
        this.originalData = {};
        this.errors = {};
        this.loaded = false;
        this.loading = false;
        this.metricInfoMap = {};
        this.page = 1;
        this.shift = 1;
        this.loadPromise = null;
        this.loadDataPromise = null;
        this.loadDataHash = null;

        this._virtualIdMap = {};
    }

    get error() {
        return this.errors.load || this.errors.loadData;
    }

    get errorMessage() {
        return this.errors.message || 'Something went wrong';
    }

    setError(request, isError, message = '') {
        this.errors[request] = isError;
        this.errors.message = message;

        // isError && console.info(
        //     `There was an error when calling metrics.${request}() for card ${this.card.id}.` +
        //     `Message returned: "${message || 'Something went wrong'}"`
        // );
    }
    
    clearErrors() {
        this.setError('load', false);
        this.setError('loadData', false);
    }

    init(cardData){
        if(cardData.metrics){
            this.assignLettersAndDecimals(cardData);
        }
        this.updateSymbolsForFormulas();
    }

    updatePositions(positions, id) {
        if(_.isEmpty(id)){
            return this.$q.resolve({
                message: 'no opportunity update positions of metrics for unsaved card'
            });
        }

        return this.DataProvider.post('card/updateMetricsPosition/' + id, {
            positions: positions
        }, false);
    }

    create(json, dataSet) {
        return MetricCollection.create(json, dataSet, this.DateRangeService, this.Auth, this.UserService);
    }

    initFromServerData(data) {
        this.metricInfoMap = data.metricInfoMap || {};
        var metrics = data.metrics || [];
        this.clear();
        metrics.forEach(metric => {
            metric && this.add(metric);
        });

        this.initMetricInfo();
        this.initColumnsMap();
    }

    isEmpty() {
        return !this || !this.length;
    }

    load(useCache = true, cacheUrlParams = false, cardUpdateModel = undefined, columnsSort = undefined) {
        this.clearErrors();
        
        this.loaded = false;

        // If card has no metrics there si no need to try loading data
        if(!this.card.hasVisibleMetricsOrFormulas()) {
            this.loaded = true;
            return this.$q.when(true);
        }

        let params = {};
        let promise = null;
        params.page = this.page;
        params.shift = this.shift;
        params.showRowCount = true;
        params.organisationId = this.Auth.user.organisation.id;
        params.dashboardId = this.card.dashboard.id;
    
        // During exports we might send withDashboardFilters=true param in which
        // case we want to auto apply dashboard filters on first load
        if (cardUpdateModel || this.card.cardUpdateModel || window.Location.withDashboardFilters) {
            useCache = false;
            params.withDashboardFilters = true;
        }

        if (!useCache) {
            params.refreshData = true;
        }

        if (this.error) {
            params.refreshBrokenCard = true;
        }

        const cardId = this.card.id;


        if (!columnsSort) {
            promise = this.DataProvider.get({
                url: 'card/existingCard/' + cardId,
                params,
                useCache,
                cacheUrlParams,
                priority: this.DataProvider.LOW_PRIORITY
            });
        } else {
            params.columnsSort = columnsSort;
            params.id = cardId;
            promise = this.DataProvider.post('card/existingCard', params);
        }

        this.loadPromise = () => {
            return promise.then(response => {
                this.updateResponseForDashboardFilter(response, cardUpdateModel, cardId);
                return this.handleLoadResponse(params, response);
            }).catch((error) => {
                console.warn('Error loading card:', cardId, error.message);
                this.setError('load', true, error.message);
                this.DataProvider.clearCache('card/existingCard/' + cardId, params, 'GET');
                this.forEach(metric => metric.clear());
                this.loadPromise = null;
            }).finally(() => {
                this.loaded = true;
                this.trigger('loaded');
            });
        };

        return this.loadPromise();
    }

    updateResponseForDashboardFilter(response, cardUpdateModel, cardId) {
        if (cardUpdateModel) {
            this.CardCacheHelperService.removeCardDataInCache(cardId);
            if (cardUpdateModel.range) {
                let representationType = response.type;
                if (representationType && representationType !== 'map') {
                    this.card.types.type = this.card.types.subType = representationType;
                }
            }
        }

    }

    handleLoadResponse(cardParams, response) {
        var cardId = this.card.id;
        this.disableEvents();

        if (response && Array.isArray(response) && !response.length) return this.$q.reject('No metrics');

        if (!this.card.isVirtual()) {
            this.clear();
        }
        
        let multicolumn = false;
    
        // TODO: Stacked - Remove this after stacked charts are migrated
        if(response.subType === 'stacked') {
            response.subType = 'bar';
        
            _.set(response, 'data.chartSettings.stacked', true);
        }
        
        this.originalData = _.clone(response.data);
        if (this.card.groupings.length && this.originalData && this.originalData.results) {
            if (this.originalData.results.length > MAX_METRIC_DATA_LENGTH) {
                console.warn(`Metric data too big. Cap to ${MAX_METRIC_DATA_LENGTH} entries. CardId: ${cardId} metric length: ${this.originalData.results.length}.`);
            }
    
            let visibleMetrics = response.metrics.filter(metric => !metric.hidden);
            
            // If we have different frequency then total each metric will have multiple values.
            // In that case we don't want to do any rearranging or transformations.
            multicolumn = visibleMetrics.length >= 1 && !this.card.frequencies.isTotalSelected();
    
            // If it's multicolumn card we will always put dimensions before metrics
            if(multicolumn) {
                let dimensions = this.originalData.columns.filter(item => item.title);
                let metrics = this.originalData.columns.filter(item => !item.title);
                
                this.originalData.columns = [...dimensions, ...metrics]
            }
            
            this.originalData.results = this.originalData.results.slice(0, MAX_METRIC_DATA_LENGTH)
                .map(row => {
                    let groups = [];

                    let isArray = row[0][0] === '[';
                    let isString = row[0][0] === '"';

                    if (isArray) groups = JSON.parse(row[0]);
                    if (isString) groups = [JSON.parse(row[0])];

                    let groupOffset = +(isArray || isString);

                    return groups.concat(row.slice(groupOffset));
                }).map(row => {
                    // If it's a multiheader card we preserve the order where groupings are before metrics
                    if(multicolumn || !this.originalData.columns || !this.originalData.columns.length) return row;
                    
                    // We need to change result order to match column order
                    let newRow = [];
                    let groupingsRemaining = this.card.groupings.length;
        
                    this.originalData.columns.forEach(column => {
                        if(column.title) {
                            newRow.push(row[0]);
                            groupingsRemaining--;
                            row = row.slice(1);
                        } else {
                            newRow.push(row[groupingsRemaining]);
                            row.splice(groupingsRemaining, 1);
                        }
                    });

                    return newRow;
                });
        }

        this.stats = response.stats || {};
        this.card.types.set(response.type, response.subType);

        this.transformTableTotals(response, multicolumn);
        this.transformResponse(response, cardParams.page);
        this.initMetricInfo();
        this.initColumnsMap();
        this.initDateInfo(response);
        this.updateSymbolsForFormulas();
        
        this.card.query = response.query;
        this.card.dataUpdated = response.dataUpdated;
        this.card.formatting.init(response.data.formatting);
        this.card.chartSettings.init(response.data.chartSettings);
        this.card.columnPosition.init(response.data.columnPosition);
        this.enableEvents();
        this.trigger('addMany');
        return this.$q.when(true);
    }
    
    initDateInfo(response) {
        if(!response.dateInfo) return;
        
        this.card.setRangeNumbers(response.dateInfo.customDateMap);
        this.card.rangeName = response.dateInfo.rangeName;
        this.card.fromDate = moment.utc(response.dateInfo.fromDate);
        this.card.toDate = moment.utc(response.dateInfo.toDate);
        this.card.cohortFromDate = response.dateInfo.cohortFromDate;
        this.card.cohortToDate = response.dateInfo.cohortToDate;
        this.card.cohortRangeName = response.dateInfo.cohortRangeName;
        this.card.cohort.init(this.card);
    }

    getLoadPromise() {
        if (!this.loadPromise) return this.load();
        return this.loadPromise();
    }

    getLoadDataPromise() {
        if (!this.loadDataPromise) return this.loadData();
        return this.loadDataPromise();
    }

    reload(cardUpdateModel = undefined) {
        return this.load(false, false, cardUpdateModel);
    }

    reloadData() {
        return this.loadData(false);
    }

    loadData(useCache = true, isDashboardFiltersEnabled = false, pageSize = null) {
        this.clearErrors();
        
        this.loaded = false;
        
        if (!this.card.hasVisibleMetricsOrFormulas()) {
            this.loaded = true;
            return this.$q.when();
        }

        var params = {
            card: this.card.getJson(),
            formatting: this.card.formatting.getJson(),
            chartSettings: this.card.chartSettings.getJson(),
            columnPosition: this.card.columnPosition.getJson(),
            showRowCount: true,
            page: this.page,
            shift: this.shift
        };
        
        if(pageSize) params.pageSize = pageSize;
        
        //get card json hash and compare. if it is same - we already have data loaded.
        var cardHash = Helpers.genHash(params);
        if (useCache && this.loadDataHash == cardHash) {
            this.loaded = true;
            return this.loadDataPromise();
        }
    
        if (!this.card.autoReload.enabled) {
            this.loaded = true;
            this.card.autoReload.setChanges(true);
            return this.$q.when();
        }
    
        this.card.autoReload.setChanges(false);
        this.loading = true;

        this.loadDataHash = cardHash;

        params.organisationId = this.Auth.user.organisation.id;
        params.dashboardId = this.card.dashboard.id;
        
        if (isDashboardFiltersEnabled) {
            params.withDashboardFilters = true;
            params.isExistingCard = true;
            params.cardId = this.card.id;
        }
        
        // We have to check for dashboard timezone and replace default one on the card,
        // because BE won't be able to pull dashboard details for virtual cards
        if(!this.card.useTimezone && this.card.dashboard.useTimezone) {
            params.card.timezone = this.card.dashboard.timezone;
            params.card.useTimezone = this.card.dashboard.useTimezone;
        }
        
        // We have to check for dashboard week start and replace default one on the card,
        // because BE won't be able to pull dashboard details for virtual cards
        if(!this.card.useStartDayOfWeek && this.card.dashboard.useStartDayOfWeek) {
            params.card.startDayOfWeek = this.card.dashboard.startDayOfWeek;
            params.card.useStartDayOfWeek = this.card.dashboard.useStartDayOfWeek;
        }
        
        let promise = this.loadDataFromCache().then((response) => {
            if(!response) return this.DataProvider.post('card/loadData', params);
    
            return response;
        });
        
        this.loadDataPromise = () => {
            return promise.then(res => {
                let result = this.handleLoadResponse({}, res);
        
                this.assignLettersAndDecimals(res);
        
                return result;
            }).catch((error) => {
                console.warn('Error loading card data:', this.card.id, error.message);
                this.setError('loadData', true, error.message);
                this.loadDataPromise = null;
            }).finally(() => {
                this.loading = false;
                this.loaded = true;
                this.trigger('loaded');
            });
        };

        return this.loadDataPromise();
    }
    
    loadDataFromCache() {
        if(!this.card.loadDataFromCache) return this.$q.when(true).then(() => false);
        
        this.card.loadDataFromCache = false;
        let cache = this.CardCacheHelperService.getData(this.card.id);
    
        if(cache) {
            cache.data.columnPosition = (cache.data.columnPosition || []).map(position => {
                if(position.type === 'dimension') return position;
            
                let metric = this.card.metrics.getByFormulaId(position.id) || this.card.metrics.getByCompareId(position.id) || this.card.metrics.getByRelationId(position.id);
                
                if(metric) {
                    position.id = metric.virtualId;
    
                    return position;
                }
            }).filter(position => !_.isEmpty(position));
            
            cache.data.formatting = (cache.data.formatting || []).map(formatting => {
                if(!formatting.columns || (formatting.columns && !_.isObject(formatting.columns[0]))) return formatting;
    
                formatting.columns = formatting.columns.map(column => {
                    if(column.type === 'dimension') return column;
                    
                    let metric = this.card.metrics.getByFormulaId(column.id) || this.card.metrics.getByCompareId(column.id) || this.card.metrics.getByRelationId(column.id);
                    
                    if(metric) {
                        column.id = metric.virtualId;
    
                        return column;
                    }
                }).filter(column => !_.isEmpty(column));
                
                return formatting;
            });
        
            cache.data.chartSettings = (cache.data.chartSettings || {});
    
            if(cache.data.chartSettings.metrics) {
                cache.data.chartSettings.metrics = cache.data.chartSettings.metrics.map(metric => {
                    let item = this.card.metrics.getByFormulaId(metric.id) || this.card.metrics.getByCompareId(metric.id) || this.card.metrics.getByRelationId(metric.id);
                    if(item) metric.id = item.virtualId;
        
                    return metric;
                });
            }
            
            if(cache.data.chartSettings.scatter) {
                if(cache.data.chartSettings.scatter.xAxisMetric) {
                    let item = this.card.metrics.getByFormulaId(cache.data.chartSettings.scatter.xAxisMetric.id) || this.card.metrics.getByCompareId(cache.data.chartSettings.scatter.xAxisMetric.id) || this.card.metrics.getByRelationId(cache.data.chartSettings.scatter.xAxisMetric.id);
                    if(item) cache.data.chartSettings.scatter.xAxisMetric.id = item.virtualId;
                }
                
                if(cache.data.chartSettings.scatter.yAxisMetric) {
                    let item = this.card.metrics.getByFormulaId(cache.data.chartSettings.scatter.yAxisMetric.id) || this.card.metrics.getByCompareId(cache.data.chartSettings.scatter.yAxisMetric.id) || this.card.metrics.getByRelationId(cache.data.chartSettings.scatter.yAxisMetric.id);
                    if(item) cache.data.chartSettings.scatter.yAxisMetric.id = item.virtualId;
                }
            }
        
            if(cache.data.chartSettings.bubble) {
                if(cache.data.chartSettings.bubble.xAxisMetric) {
                    let item = this.card.metrics.getByFormulaId(cache.data.chartSettings.bubble.xAxisMetric.id) || this.card.metrics.getByCompareId(cache.data.chartSettings.bubble.xAxisMetric.id) || this.card.metrics.getByRelationId(cache.data.chartSettings.bubble.xAxisMetric.id);
                    if(item) cache.data.chartSettings.bubble.xAxisMetric.id = item.virtualId;
                }
                
                if(cache.data.chartSettings.bubble.yAxisMetric) {
                    let item = this.card.metrics.getByFormulaId(cache.data.chartSettings.bubble.yAxisMetric.id) || this.card.metrics.getByCompareId(cache.data.chartSettings.bubble.yAxisMetric.id) || this.card.metrics.getByRelationId(cache.data.chartSettings.bubble.yAxisMetric.id);
                    if(item) cache.data.chartSettings.bubble.yAxisMetric.id = item.virtualId;
                }
            }
        
            if(cache.data.chartSettings.sankey) {
                if(cache.data.chartSettings.sankey.metric) {
                    let item = this.card.metrics.getByFormulaId(cache.data.chartSettings.sankey.metric.id) || this.card.metrics.getByCompareId(cache.data.chartSettings.sankey.metric.id) || this.card.metrics.getByRelationId(cache.data.chartSettings.sankey.metric.id);
                    if(item) cache.data.chartSettings.sankey.metric.id = item.virtualId;
                }
            }
        
            cache.data.columns = cache.data.columns.map(column => {
                if(column.title) return column;
            
                let metric = this.card.metrics.getByColumnDesc(column);
                
                if(metric) {
                    column = _.omit(column, ['formulaId', 'compareId', 'relationId']);
                    column.virtualId = metric.virtualId;
                }
            
                return column;
            });
        
            cache.metrics = cache.metrics.map(metric => {
            
                if(metric.formulas) metric.formulas = [];
                metric.table = _.isObject(metric.table) ? metric.table.id : metric.table;
                metric.owner = _.isObject(metric.owner) ? metric.owner.id : metric.owner;
                let virtualMetric = this.card.metrics.getByColumnDesc(metric);
            
                if(virtualMetric) {
                    metric.relationId = null;
                    // TODO: check if we need to set formulaId to virtualId
                    // TODO: check if we need to set id to null for formulas
                
                    // TODO: check if we need to set comparedTo to null for compares
                    // TODO: check if we need to set compareId to null for compares
                    // TODO: check if we need to set id to null for compares
                    metric.virtualId = virtualMetric.virtualId;
                }
            
                return metric;
            });
        }
    
        return this.$q.when(true).then(() => cache);
    }

    assignLettersAndDecimals(data) {
        data.metrics.forEach(rawMetric => {
            let metric = rawMetric.id ? this.getByRawId(rawMetric.id) : this.find(item => item.virtualId == rawMetric.virtualId);
            
            if (!metric) return;
            
            if (metric.isFormula()) {
                metric.info.expression = rawMetric.title;
            } else {
                metric.numberOfDecimals = rawMetric.numberOfDecimals;
                metric.letter = metric.letter || rawMetric.letter;
            }
        });
    }

    addCompares(metricsData) {
        this.disableEvents();
        metricsData.forEach(json => {
            json.virtualId = this.card.nextVirtualId();
            this.add(json, undefined);
        });
        this.enableEvents();
        this.trigger('addMany');
    }

    addFormula(formula) {
        // const virtualId = this.card.nextVirtualId();
        return this.add({
            formula: true,
            virtualId: formula.data.virtualId,
            color: formula.color,
            expression: formula.data.expression,
            name: formula.data.name,
            type: formula.data.type,
            formulaId: formula.data.id,
            order: formula.data.order,
            isColoring: formula.data.isColoring,
            isIncrease: formula.data.isIncrease
        });
    }

    removeFormula(formula) {
        this.remove(this.find(ds => ds.isFormula() && ds.virtualId === formula.data.virtualId));
    }

    removeAllFormulas() {
        this.forEach(ds => ds.isFormula() && this.remove(ds));
    }

    addMetric(metric) {
        var json = angular.copy(metric.info);
        if (this.card.isVirtual()) {
            json.id = metric.id;
            json.virtualId = this.card.nextVirtualId();
        }

        var count = 0;

        this.forEach(m => {
            if (m.rawId == json.id) {
                count++;
            }
        });
        if (count > 0) json.name += ` (${count})`;

        this.add(json, undefined);
        this.columnsMap[json.virtualId] = [0, 1];
        this.card.frequencies.updateAvailable();
        return this.loadData();
    }

    remove(metric) {
        //remove all dependants for provided dataset
        if (!metric.isComparable()) {
            this.card.compare.removeByDataSet(metric);
            this.card.formulas.removeByDataSet(metric);
            this.card.filters.removeByDataSet(metric);
        } else {
            this.card.formulas.removeByDataSet(metric);
        }

        super.remove(metric);
    }

    removeMetric(metric) {
        if (!this.getById(metric.id)) {
            return this.$q.when({success: 'metric already removed'});
        }

        this.remove(metric);

        this.card.frequencies.updateAvailable();
        if (this.length === 0) {
            this.card.groupings.clear();
            this.clear();
            return this.$q.when();
        }

        return this.loadData();
    }

    updateCumulativeStatus(metric) {
        metric.toggleCumulativeStatus();
        return this.loadData(false);
    }

    updateColoring(metric) {
        metric.toggleColoring();
        return this.loadData(false);
    }

    transformResponseForVirtual(dataSets, responseMetrics, page) {
        dataSets.forEach((dataSet, idx) => {
            let responseMetric = responseMetrics[idx];
            let metric = this.getDataSetById(responseMetrics[idx].virtualId);
            
            if(!metric) {
                throw new Error('Invalid card object. Please refresh a card.');
            }
    
            metric.setData(dataSet);
            metric.setXAxisInfo(responseMetric.xAxis || {});
            metric.setYAxisInfo(responseMetric.yAxis || {});
        });
    
        // Sort metrics in a same order they are received from the API
        this.items = _.sortBy(this.items, function(item){
            return _.findIndex(responseMetrics, ['virtualId', item.virtualId]);
        });
    }

    /** @private */
    transformResponse(dataResponse, page) {
        var dataSets;

        if (dataResponse.metrics) {
            if (!dataResponse.metrics.length) {
                console.warn('No metrics in response. ', dataResponse);
                return [];
            }
        } else {
            console.warn('No metrics in response. ', dataResponse);
            return [];
        }

        // Get only visible metrics
        var visibleMetrics = dataResponse.metrics.filter(metric => !metric.hidden);

        if (dataResponse.data.sum !== undefined) { //numeric
            dataSets = Array.isArray(dataResponse.data.sum) ? dataResponse.data.sum : [dataResponse.data.sum];
        } else if (visibleMetrics[0].type.toLowerCase() === 'map') {
            dataSets = [dataResponse.data];
        } else {
            dataSets = visibleMetrics.map((metric, index) => {
                if(!Array.isArray(dataResponse.data.results)) return [];

                return dataResponse.data.results.map(row => [row[0], row[index + 1]]);
            });
        }

        if (this.card.isVirtual()) return this.transformResponseForVirtual(dataSets, visibleMetrics, page);

        // We only receive data for visible metrics, so lets generate data for the here
        var metricsData = [];
        dataSets.forEach((dataSet, index) => {
            var desc = visibleMetrics[index];
            var id = MetricModel.getIdFromJson(desc);
            var currentMetric = this.getById(id);
            if (!currentMetric) {
                var subType;
                if (this.getMetricInfo(desc.id)) {
                    subType = this.getMetricInfo(desc.id).subType;
                    if (subType) desc.subType = subType;
                }

                if (page && dataSet) dataSet.page = page;

                // if (dataResponse.data.columns && !visibleMetrics[index].columns) {
                //     desc.columns = dataResponse.data.columns;
                // }

                metricsData.push({desc, dataSet});
            }
        });

        // Merge all metrics back together and add back hidden metrics with no data
        var hiddenOffset = 0;
        dataResponse.metrics.forEach((metric, index) => {
            if (metric.hidden) {
                var id = MetricModel.getIdFromJson(metric);
                if (!this.getById(id)) {
                    var metricInfo = this.getMetricInfo(metric.id);
                    if (metricInfo && metricInfo.subType) {
                        metric.subType = metricInfo.subType;
                    }
                    this.add(metric, []);
                }

                hiddenOffset++;
            } else {
                var data = metricsData[index - hiddenOffset];
                this.add(data.desc, data.dataSet);
            }
        });
    }

    /**
     * @private
     */
    updateSymbolsForFormulas(){
        this.forEach(
            /**
             * @param {MetricModel} metric
             */
            metric => {
                if(metric.isComparable() || metric.isFormula()) {
                    let formulaId = metric.isComparable() ? metric.comparedTo : metric.formulaId;
                    
                    let formula = this.card.formulas.getById(formulaId);

                    if(formula) {
                        metric.setYAxisInfo({symbol: formula.getType()});
                    }
                }
            }
        );
    }

    getMetricInfoByIndex(index) {
        if (!this.metricInfoMap) return {};
        var key = Object.keys(this.metricInfoMap)[index];
        return this.metricInfoMap[key];
    }

    getMetricInfo(id) {
        if (!this.metricInfoMap) return {};
        if (id !== undefined) return this.metricInfoMap[id];
        return this.metricInfoMap;
    }

    initMetricInfo() {
        var info = {};
        var type = this.card.types.get().toLowerCase();
        var subType = this.card.types.subType.toLowerCase();

        if (!this.initialMetricInfoMap && !_.isEmpty(this.metricInfoMap))
            this.initialMetricInfoMap = angular.copy(this.metricInfoMap);

        this.items.forEach((metric, index) => {
            var id = this.card.isVirtual() ? metric.virtualId : metric.id;

            var metricInfo = this.metricInfoMap[id] || {};

            if (type === 'bar') { type = this.card.types.subType; }
            if (type === 'chart') { type = this.card.types.subType; }
            if (subType === 'mixed') {type = index === 0 ? 'bar' : 'line'; }
            metricInfo.subType = type;

            if (this.initialMetricInfoMap && this.initialMetricInfoMap[id])
                metricInfo.order = this.initialMetricInfoMap[id].order;
            else if (this.metricInfoMap && this.metricInfoMap[id])
                metricInfo.order = this.metricInfoMap[id].order;

            info[id] = metricInfo;
        });

        this.metricInfoMap = info;
    }

    hideMetric(metric) {
        if (metric.isHidden()) return this.$q.when();
        
        metric.hide();
        
        this.trigger('hide', metric);
        
        if (this.getVisibleCount() === 0) {
            this.trigger('loaded');
            return this.$q.when();
        }
        var promise = this.loadData();

        if (this.card.metrics.error) return this.$q.when();

        return promise;
    }

    showMetric(metric) {
        if (!metric.isHidden()) return this.$q.when();
        
        metric.show();
    
        this.trigger('show', metric);
        
        var promise = this.loadData();

        if (this.card.metrics.error) return this.$q.when();

        return promise;
    }

    getColumnsMap() {
        return this.columnsMap;
    }

    initColumnsMap() {
        this.columnsMap = {};
        this.forEach(metric => {
            var id = this.card.isVirtual() ? metric.virtualId : metric.id;
            var metricInfo = this.metricInfoMap[id] || {};
            this.columnsMap[id] = metricInfo.columnsMap || [0, 1];
        });
    }

    /**
     * HACK! kill it as soon as you can!
     * function supposed to return metric data from table with groupings and date interval
     * to be used in a chart
     *
     * @todo: should be renamed to getMetricsBasedData
     */
    getMetricBasedData(metrics = this.items) {
        if (!this.loaded) return [];
        if (!this.card.groupings.length) return metrics;

        var groupNum = 0;
        while (this.originalData.columns &&
               groupNum < this.originalData.columns.length &&
               this.originalData.columns[groupNum].title
            ) {
            groupNum++;
        }

        var isDrillTotal = this.card.drill.isTotal();

        var res = [];
        this.originalData.results.forEach(row => {
            var i = groupNum;
            var postfix = row.slice(0, i).join(",");
            var metricsData = new Map();
            var metric;
            while (i < row.length) {
                metric = this.getByColumnDesc(this.originalData.columns[i]);
                if (metrics.indexOf(metric) !== -1) {
                    var data = metricsData.get(metric) || [];
                    var x;
                    x = isDrillTotal ? postfix : this.originalData.columns[i].time;
                    data.push([x, row[i]]);
                    metricsData.set(metric, data);
                }
                i++;
            }

            metricsData.forEach((data, metric) => {
                var chartMetric;
                chartMetric = MetricCollection.create(metric.info, data, this.DateRangeService, this.Auth, this.UserService);
                if (!isDrillTotal) chartMetric.setName(this.card.metrics.length == 1 ? postfix : chartMetric.label + "-" + postfix, true);
                res.push(chartMetric);
            });
        });
        return res;
    }

    updateMetric(metric, data) {
        if (metric.name === data.name && metric.color === data.color) return;

        metric.setName(data.name);
        metric.color = data.color;
        metric.resetColumns();

        //not actually loaded but it will force ui redraw with new name/color
        //one day it will be handled by proper events
        this.trigger('loaded');
    }

    getRegular() {
        return this.filter(metric => metric.isRegular());
    }

    getJson() {
        return this.map((metric, idx) => {
            var res = metric.getJson();
            res.position = idx;
            return res;
        });
    }

    getDataSetById(id) {
        //virtualId atm
        return this.items.find(item => item.virtualId === id);
    }

    getState() {
        return {
            metrics: this.items.map(metric => metric),
        };
    }

    setState(state) {
        this.items = state.metrics;
    }

    /**
     * return metric corresponding to column descriptor from UDM
     * @param desc
     */
    getByColumnDesc(desc) {
        if (!desc || !_.isObject(desc)) {
            return null;
        }
    
        if ('virtualId' in desc)  return this.getDataSetById(desc.virtualId);
        if ('formulaId' in desc) return this.getByFormulaId(desc.formulaId);
        if ('compareId' in desc) return this.getByCompareId(desc.compareId);
        if ('relationId' in desc) return this.getByRelationId(desc.relationId);
    
        // In case there is title property we have grouping column
        if ('title' in desc)  return null;
        
        console.warn('Weird columns descriptor: no corresponding metric:', desc);
        return null;
    }

    setPage(page, cardUpdateModel = undefined, columnSort = undefined) {
        this.card.cardUpdateModel = cardUpdateModel;
        return this.setPagination(page, 'page', columnSort);
    }

    setHorizontalPage(page, columnSort = undefined) {
        return this.setPagination(page, 'shift', columnSort);
    }

    /**
     * @private
     */
    setPagination(page, type = 'page', columnSort) {
        if (page < 1) return this.$q.when(true);
        this[type] = page;
        /*if (this.card.drill.isActive()) {
            return this.card.drill.reload();
        } else */if (this.card.isVirtual()) {
            return this.loadData();
        } else {
            return this.load(true, true, undefined, columnSort);
        }
    }

    canAddMetric(metricId) {
        return this.DataProvider.post('card/canAddMetric', {
            card: this.card.getJson(),
            metricId: metricId,
        });
    }

    /**
     * @param {MetricModel} metric
     * @returns {*|Promise.<T>}
     */
    checkAndAdd(metric){
        return this.canAddMetric(metric.rawId).then(() => {
            return this.addMetric(metric);
        });
    }

    setVirtualIdMap(map){
        this._virtualIdMap = map || {};
    }

    getRealIdFromVId(virtualId){
        return this._virtualIdMap[virtualId];
    }

    getVIdFromReal(realID){
        return _.invert(this._virtualIdMap)[realID];
    }
    
    transformTableTotals(response, multicolumn) {
        this.tableTotals = response.tableTotals || [];
    
        if (this.originalData.columns && this.card.groupings.length) {
            // Get number of columns displayed on the table
            let numberOfColumns = this.originalData.columns.length;
            let numberOfTotals = this.tableTotals.length;
        
            // Make array of totals same length as array of table columns
            for (let i = 0; i < numberOfColumns - numberOfTotals; i++) {
                this.tableTotals.unshift(null);
            }
        }
    
        if(!multicolumn && this.card.groupings.length) {
            // We need to change result order to match column order
            let tableTotals = _.clone(response.tableTotals);
            let newTableTotals = [];
        
            let groupingsRemaining = this.card.groupings.length;
    
            this.originalData.columns.forEach(column => {
                if(column.title) {
                    newTableTotals.push(tableTotals[0]);
                    groupingsRemaining--;
                    tableTotals = tableTotals.slice(1);
                } else {
                    newTableTotals.push(tableTotals[groupingsRemaining]);
                    tableTotals.splice(groupingsRemaining, 1);
                }
            });
    
            this.tableTotals = newTableTotals;
        }
    }
    
    columnIsNumeric(index) {
        let columnIndex = _.get(this.card.metrics.originalData, `columns[${index}]`, false);
        
        if(columnIndex) {
            let metric = this.card.metrics.getByColumnDesc(columnIndex);
            
            // Metric value is always numeric except for time metrics
            if(metric && _.get(metric.getFormattingInfo(), 'type') !== 'time') return true;
            
            // In case of groupings we need to check for grouping column type
            let title = _.get(columnIndex, 'title', null);
            
            let grouping = this.card.groupings.find(grouping => grouping.getLabel() === title);
            
            if(grouping) return grouping.column.isNumber;
        }
        
        return false;
    }
    
    getMetricId(item) {
        if(this.getMetricType(item) === 'comparable') return item.virtualId || item.rawId;
        if(this.getMetricType(item) === 'formula') return item.virtualId || item.formulaId;
        
        return item.virtualId || item.relationId;
    }
    
    getMetricType(metric) {
        if(metric.isFormula()) return 'formula';
        if(metric.isComparable()) return 'comparable';
        
        return 'metric';
    }
}

truedashApp.service('CardMetricsFactory', (DataProvider, $q, DateRangeService, Auth, UserService, CardFullInfoLoadingService, CardCacheHelperService) => ({
    create: (card) => {
        return new CardMetrics(card, DataProvider, $q, DateRangeService, Auth, UserService, CardFullInfoLoadingService, CardCacheHelperService);
    }
}));
