'use strict';

import {EventEmitter} from '../../system/events.js';
import {MetricModel} from './metric.model.js';
import {DATE_RANGE_CUSTOM_VALUE} from '../../config.js';
import {RangeModel} from '../../common/models/range.model';
import {ColumnSorting} from '../columnSorting';
import {ExportLinks} from '../exportLinks';
import {ColumnHelper} from './../../../content/card/datatable/column.helper.js';
import HighchartCardType from '../highchart/highchartCardType';
import ColumnPosition from '../columnPosition';
import Formatting from '../formatting';
import ChartSettings from '../chartSettings';
import AutoReload from '../autoReload';
import {Config} from '../../config.js';

export class Card extends EventEmitter {
    constructor(dashboard, cardData, CardCompareFactory, CardGroupingsFactory, CardFormulasFactory,
                CardFactory, CardMetricsFactory,
                CardFiltersFactory, CardTypesFactory, CardCacheHelperService,
                CardFrequenciesFactory, $q, DataProvider, CardPositioningFactory, AnnotationsFactory,
                Auth, UserService, CardCohortFactory, CardTableFactory, DateRangeService, $filter, CardDrillFactory, CardImageFactory,
                DashboardCollection, DashboardCacheHelperService, AppEventsService, AlertsFactory, $state) {
        super();

        //@todo: should be removed
        this.virtualDataSetId = 1;

        this.$q = $q;
        this.Auth = Auth;
        this.$state = $state;
        this.$filter = $filter;
        this.CardFactory = CardFactory;
        this.UserService = UserService;
        /** @type {DataProvider} **/
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.CardImageFactory = CardImageFactory;
        this.CardTableFactory = CardTableFactory;
        /** @type {DateRangeService} **/
        this.DateRangeService = DateRangeService;
        this.DashboardCollection = DashboardCollection;
        this.CardCacheHelperService = CardCacheHelperService;
        this.DashboardCacheHelperService = DashboardCacheHelperService;

        //supposed to be read-only and update from server.
        //holds original card state to compare, dirty checks, etc.
        this.rawData = undefined;

        /** keep saved state to be restored on errors */
        this.savedState = null;

        this.selectedTotals = [];
        this.cardExportInfos = [];
        this.isRemoved = false;
        this.cardTable = null;
        this.ownerDef = null;
        this.owner = null;
        this.noSort = false;
        this.showGroupingAsPercentage = false;
        this.showCompareStats = true;
        this.showTableTotals = false;
        this.isTransposeTable = false;
        this.timezone = null;
        this.useTimezone = false;
        this.startDayOfWeek = 1;
        this.useStartDayOfWeek = false;
        this.fillChart = false;
        this.showTrendLine = false;
        this.extendTrendLine = null;
        this.goal = null;
        this.showValueLabels = false;
        this.moving = {from: false, to: false};
        this.infoPromise = null;

        this._id = null;

        /** @type {CardMetrics} */
        this.metrics = CardMetricsFactory.create(this);
        /** @type {CardFilters} */
        this.filters = CardFiltersFactory.create(this);
        /** @type {CardTypes} */
        this.types = CardTypesFactory.create(this);

        /** @type {CardFrequencies} */
        this.frequencies = CardFrequenciesFactory.create(this);
        /** @type {CardFormulas} */
        this.formulas = CardFormulasFactory.create(this);
        this.groupings = CardGroupingsFactory.create(this);
        /** @type {CardCompare} */
        this.compare = CardCompareFactory.create(this);
        this.positioning = CardPositioningFactory.create(this);
        this.alerts = AlertsFactory.create(this);
        this.cohort = CardCohortFactory.create(this);
        this.drill = CardDrillFactory.create(this);

        this.image = CardImageFactory.create(this);

        this.formatting = new Formatting(this);
        this.chartSettings = new ChartSettings(this);
        this.columnPosition = new ColumnPosition(this);
        this.columnSorting = new ColumnSorting(this);
        this.exportLinks = new ExportLinks(this);
        
        this.autoReload = new AutoReload();
        
        this.annotations = new AnnotationsFactory.create();
        
        // If this is true we will try to use existingCard response from cache for virtual cards inside loadData.
        // This is useful for initial card builder and explore mode load as we will have one API less if data is already cached.
        this.loadDataFromCache = false;

        this.dashboard = dashboard;
        this.query = null;
        this.dataUpdated = null;
        
        delete cardData.dashboard;
        this.originalCardData = _.clone(cardData);

        // Only part of card data can be loaded through current user request so we don't have access to metrics property yet.
        // In order to determine if card is draft we need to know when it is fully loaded
        this.isPartial = !cardData.metrics;
        this.init(cardData);
    }

    /**
     * This will return true if card is being looked on explore mode, card builder, home page
     * or if card is displayed in current dashboard (inactive cards are not displayed)
     */
    isBeingLookedAt() {
        let isOnDashboard = ['dashboard'].includes(this.$state.current.name) && this.active;
        let isExploreOrCardBuilder = ['cardExplore', 'cardBuilder'].includes(this.$state.current.name);
        let isCurrentCard = this.id === parseInt(this.$state.params.cardId);
        let isOnHomepage = ['home'].includes(this.$state.current.name) && this.active;

        return isOnHomepage || isExploreOrCardBuilder && isCurrentCard || isOnDashboard;
    }

    /**
     * @deprecated
     * @returns {boolean}
     */
    isVirtual() {
        return this._id === null;
    }

    restoreOriginalCardData() {
        this.init(this.originalCardData);
    }

    get id(){
        return this.virtualizedFromId || this._id;
    }

    set id(value){
        let id = parseInt(value);
        
        this._id = isNaN(id) ? null : id;
    }

    init(card) {
        card = card || {};
        this.rawData = {};
        
        this.updateFromServerData(card);

        this.refreshCardData(card);
        this.metrics.initFromServerData(card);
        this.initCardTable();
        return this;
    }

    /** @private */
    updateFromServerData(cardData) {
        cardData.fromDate = moment.utc(cardData.fromDate);
        cardData.toDate = moment.utc(cardData.toDate);

        angular.extend(this.rawData, cardData);

        this.rangeName = cardData.rangeName || null;
        this.setRangeNumbers(cardData.customDateMap);
        this.toDate = cardData.toDate;
        this.name = cardData.name;
        this.text = cardData.text;

        this.id = cardData.id;
        this.xAxis = cardData.xAxis;
        this.yAxis = cardData.yAxis;
        this.isRemoved = !!cardData.isRemoved;
        this.multipleAxis = !!cardData.multipleAxis;
        this.description = cardData.description || '';
        this.active = !!cardData.active;
        this.createdBy = cardData.createdBy;
        this.fromDate = cardData.fromDate;

        this.moving = cardData.moving || this.getMovingFromRangeName(this.rangeName);

        this.noSort = !!cardData.noSort;
        this.showGroupingAsPercentage = !!cardData.showGroupingAsPercentage;
        this.showCompareStats = !!cardData.showCompareStats;
        this.showTableTotals = !!cardData.showTableTotals;
        this.isTransposeTable = !!cardData.isTransposeTable;
        this.timezone = cardData.timezone || Config.timezone;
        this.useTimezone = !!cardData.useTimezone;
        this.startDayOfWeek = cardData.startDayOfWeek || 1;
        this.useStartDayOfWeek = !!cardData.useStartDayOfWeek;
    }

    setRangeNumbers(range){
        range = range || {};

        this.customDateMap = new RangeModel(range);
    }

    remove(dashboard = this.dashboard) {
        return this.DataProvider.post('card/delete/' + this.id, {dashboardId: this.dashboard.id}, false).then(() => {
            this.isRemoved = true;
            dashboard.cards.remove(this.id);

            this.trigger('removed', this);

            this.AppEventsService.track('removed-card', {id: this.id});
        });
    }

    exportableToDexi() {
        if(this.drill.isActive()) return false;
        if(this.isTransposeTable) return false;
        if(!this.types.isTable()) return false;

        if(this.groupings.length) {
            // This is a multiheader card and we are not supporting that yet
            if(!this.frequencies.isTotalSelected()) return false;
        } else {
            // This is custom table showing total sum for each metric and we are not supporting that yet
            if(this.frequencies.isTotalSelected()) return false;
        }
        
        return this.hasData();
    }

    isDrillable() {
        if(this.drill.isActive()) return false;
        if(this.isTransposeTable) return false;

        // We don't do drilling for all card types
        let drillableTypes = ['line', 'spline', 'symbol', 'mixed', 'pie', 'donut', 'bar', 'horizontal'];
        
        if(!drillableTypes.includes(this.types.get()) && !drillableTypes.includes(this.types.subType)) return false;
        
        return this.hasData();
    }

    enterDrillMode() {
        this.inDrillMode = this.isDrillable();
    }
    
    exitDrillMode() {
        this.inDrillMode = false;
    }

    isInDrillMode() {
        return this.inDrillMode;
    }

    isHighchart() {
        let highchartType = new HighchartCardType(this);
        return highchartType.isHighchart();
    }
    
    getDateString() {
        let dates = this.DateRangeService.getDateFromName(this.rangeName, this.fromDate, this.toDate, this.customDateMap);
    
        return `${dates.from.format('MMMM Do, YYYY')} - ${dates.to.format('MMMM Do, YYYY')}`;
    }

    getDateRangeString(withDates = true) {
        let range = this.DateRangeService.getFullRangeLabelObject(this.rangeName, this.fromDate, this.toDate, this.customDateMap);
        
        if(withDates) return range.label + ' ' + range.date;
        
        // For custom dates like between and week we will return dates instead of labels
        return range.custom ? range.date.replaceAll(['(', ')'], '') : range.label;
    }
    
    getDateRangeStringWithFrequencyAndTimezone(usedTimezone = false) {
        let string = this.getDateRangeString(false);
        
        string = this.frequencies.convertToSentence(string);
        
        // For presentation mode and explore mode we want to show used timezone
        // because we don't have information about dashboard level timezone
        let timezoneString = usedTimezone ? this.usedTimezoneString() : this.timezoneString();
        
        if(timezoneString) string += ' (' + timezoneString + ')';
        
        return string;
    }
    
    timezoneString() {
        if(!this.useTimezone) return '';
    
        if(this.timezone === 'UTC') return this.timezone;
        
        return this.timezone + ' UTC' + moment().tz(this.timezone).format('Z');
    }
    
    usedTimezoneString() {
        if(this.useTimezone) return this.timezoneString();
    
        if(this.dashboard && this.dashboard.useTimezone) return this.dashboard.timezoneString();
        
        return window.Auth.user.timezoneString();
    }

    lastUpdateFormatted() {
        let value = this.getDataUpdated();
        return value && `Updated ${moment(value).fromNow()}`;
    }

    getTotal() {
        return this.metrics.stats.totalValue || 0;
    }

    getPrevTotal() {
        return this.metrics.stats.prevTotalValue || 0;
    }

    getTableTotals() {

        if (!this.metrics.tableTotals.length) return [];
    
        // Add formatting options to totals
        return this.metrics.tableTotals.map((total, index) => {
            let totalObject = {value: total, format: false, metric: false};

            let metric = null;

            if (total !== null && this.metrics.originalData.columns) {
                metric = this.metrics.getByColumnDesc(this.metrics.originalData.columns[index]);
            }

            if (metric) {
                totalObject.metric = metric;
                totalObject.format = metric.getFormattingInfo();
            }
            
            // With total frequency and no groupings table is rendered vertically.
            // Metrics are displayed in first column so we have one table total for all metrics.
            // This is why we remove metric and formatting values as they are not applicable in this case.
            if(this.frequencies.isTotalSelected() && !this.groupings.length) {
                totalObject.metric = false;
                totalObject.format = false;
            }

            return totalObject;
        }) || [];
    }

    reloadFullInfo() {
        return this.loadFullInfo(false);
    }

    loadFullInfo(useCache = true) {
        this.infoPromise = this.DataProvider.get('card/info/' + this.id, {}, useCache).then((data) => {
            this.refreshCardData(data);
            return this;
        }).catch(angular.noop);
        return this.infoPromise;
    }

    preloadFullInfo(data = {}){
        this.DataProvider.putToCache('card/info/' + this.id, {}, data);
    }

    getInfoPromise() {
        if (!this.infoPromise) return this.loadFullInfo();
        return this.infoPromise;
    }

    invalidateFullInfo() {
        this.infoPromise = null;
        this.dashboard.cards.invalidate();
        this.DataProvider.clearCache('card/info/' + this.id, undefined, 'GET');
    }

    refreshCardData(card) {
        this.selectedTotals = card.selectedTotals || [];
        this.cardExportInfos = card.cardExportInfos || [];
        this.cohort.init(card);
        this.filters.init(card);
        this.frequencies.init(card);
        this.types.init(card);
        this.formulas.init(card);
        this.groupings.init(card);
        this.positioning.init(card);
        this.alerts.init(card.alerts || []);
        this.drill.init(card);
        this.image.init(card);
        this.metrics.init(card);
        this.columnSorting.sortOrder = card.columnsSort;
        this.size = card.size;
        this.text = card.text;
        this.fillChart = card.fillChart;
        this.showTrendLine = card.showTrendLine;
        this.extendTrendLine = card.extendTrendLine;
        this.goal = card.goal;
        this.showValueLabels = card.showValueLabels;
        this.visualOrderInfo = card.visualOrderInfo || {};
        this.dataUpdated = card.dataUpdated || new Date().getTime();
        this.columnPosition.init(card.columnPosition);
        this.formatting.init(card.formatting);
        this.exportLinks.init(card.cardExportInfos);
        this.chartSettings.init(card.chartSettings);
    }

    /** @private */
    initCardTable() {
        if (this.types.get() !== 'table' || this.cardTable) return;

        this.cardTable = this.CardTableFactory.create();
    }

    isOwnedByCurrentUser() {
        if (!this.Auth.isLoggedIn()) return false;
        return this.createdBy === this.Auth.user.username;
    }

    duplicate(dashboard = this.dashboard, name) {
        let params = {
            name: name || this.name,
            dashboardId: dashboard.id,
        };
        
        return this.DataProvider.get('card/copy/' + this.id, params, false, null, null, false)
            .then(card => {
                dashboard.cards.add(card);

                this.AppEventsService.track('cloned-card', {source_id: this.id, cloned_id: card.id});
            });
    }

    doSave() {
        let params = {
            dashboard: this.dashboard.id,
            card: this.getJson(),
            drillMap: this.drill.getJson(),
            formatting: this.formatting.getJson(),
            chartSettings: this.chartSettings.getJson(),
            columnPosition: this.columnPosition.getJson(),
        };

        params.card.createdBy = params.card.createdBy || this.Auth.user.username;

        return this.DataProvider.post('card/save', params).then(card => {
            this.virtualizedFromId = card.id;
            this.dashboard.cards.add(card);
    
            this.AppEventsService.track('created-card', {id: card.id});
            
            if(params.card.subType == 'heat') {
                this.AppEventsService.track('created-heatmap-card', {id: card.id});
            }
        });
    }

    doUpdate() {
        let params = {
            dashboard: this.dashboard.id,
            card: this.getJson(),
            drillMap: this.drill.getJson(),
            formatting: this.formatting.getJson(),
            chartSettings: this.chartSettings.getJson(),
            columnPosition: this.columnPosition.getJson(),
        };

        params.card.createdBy = params.card.createdBy || this.Auth.user.username;

        return this.DataProvider.post('card/update/' + this.id, params).then((data) => {
            //update original card with saved changes
            let card = this.DashboardCollection.findCard(this.id);

            this.AppEventsService.track('updated-card', {id: card.id});

            // if card is changed to heatmap we will trigger created heatmap event
            if(card.types.subType == 'heat' && params.card.subType != 'heat') {
                this.AppEventsService.track('created-heatmap-card', {id: card.id});
            }

            if (this.dashboard.id !== card.dashboard.id) {
                if (card && card.positioning && card.positioning.position) {
                    card.positioning.position.col = null;
                    card.positioning.position.row = null;
                }
                if (data && data.position) {
                    data.position.col = null;
                    data.position.row = null;
                }
                if (card.positioning && data) {
                    card.positioning.positionId = data.positionId;
                }
                this.DashboardCollection.moveCard(card.dashboard, this.dashboard, card);
            }
    
            this.CardCacheHelperService.setCard(this.dashboard, data);
            this.dashboard.cards.invalidate();
            card.init(data);
            card.metrics.loadPromise = null;
            card.metrics.loaded = false;
            
            this.DataProvider.clearUrlCache('card/existingCard/' + card.id, 'GET');
        });
    }

    isPersisted() {
        return !!this.id;
    }

    isCustomSQL() {
        return !!this.metrics.find((metric) => metric.isSQLBased());
    }

    save() {
        //todo: clear dashboard's card cache
        return this.isPersisted() ? this.doUpdate() : this.doSave();
    }

    /** @private */
    compareAxes(axis, axis2) {
        return axis.label === axis2.label &&
               axis.name === axis2.name;
    }

    setSize(size) {
        if (this.size != size) this.size = size;
        return this.size;
    }

    updateDateMoving(moving) {
        this.moving = angular.copy(moving);
    }

    getMovingFromRangeName(name) {
        let rangeObject = this.DateRangeService.getRangeObjectByName(name);
        return rangeObject && rangeObject.moving ? rangeObject.moving : {from: false, to: false};
    }

    updateDates(dates, range) {
        this.rangeName = range;

        if(range !== DATE_RANGE_CUSTOM_VALUE){
            this.moving = this.getMovingFromRangeName(range);
        }

        //@todo: remove later on refactoring BE
        this.fromDate = moment(dates.startDate);
        this.toDate = moment(dates.endDate);

        return this.metrics.loadData();
    }

    updateDatesForDashboardFilters(dates, range) {
        this.rangeName = range;

        let from = moment().diff(dates.startDate, 'days');
        let to = moment().diff(dates.endDate, 'days') + 1;

        this.customDateMap = new RangeModel({from: from, to: to});

        //@todo: remove later on refactoring BE
        this.fromDate = moment(dates.startDate);
        this.toDate = moment(dates.endDate);
    }

    getOwner() {
        if (!this.owner) this.loadOwner();
        return this.owner;
    }

    loadOwner() {
        if(!this.createdBy) return this.$q.when(true);

        if(this.ownerDef) return this.ownerDef();

        // Do not retrieve current user details as we already have it in session
        if(this.createdBy === this.Auth.user.username) {
            this.ownerDef = () => {
                return this.$q.when(true).then(() => {
                    this.owner = this.Auth.user;
                });
            };
        } else {
            this.ownerDef = () => {
                return this.UserService.retreiveUserDetails(this.createdBy).then((user) => {
                    this.owner = this.UserService.create(user);
                }).catch(angular.noop)
            };
        }

        return this.ownerDef();
    }

    getName() {
        return this.name;
    }

    userCanEdit() {
        // User can only edit his own dashboards unless he is admin
        return !this.dashboard.isOrganisationDashboard() || this.dashboard.isOrganisationDashboard() && this.Auth.user.isAdmin();
    }

    addMissingOrderIndexes() {
        let usedIndexes = this.metrics.items
            .filter(item => item.order !== undefined)
            .map(item => item.order);

        this.metrics.items
            .filter(item => item.order === undefined)
            .forEach(item => {
                var i;
                for (i = 0; usedIndexes.indexOf(i) != -1; i++);
                item.order = i;
                usedIndexes.push(i);
            });
    }

    prepareMetricInfoMap() {
        var infoMap = {};

        this.addMissingOrderIndexes();

        let metrics = this.metrics;
        metrics.forEach((metric, index) => {
            var id = metric.virtualId;
            if (!id && metrics._virtualIdMap && metric.id) {
                id = metrics._virtualIdMap[metric.id];
            }

            var info = infoMap[id] = {};

            info.order = metric.order === undefined ? index: metric.order;

            if (metric.order > 0 && !this.metrics.find(item => item.order == metric.order - 1))
                this.metrics.get(index).order--;
        });


        return infoMap;
    }

    /**
     * @deprecated
     * @returns {number}
     */
    nextVirtualId() {
        return this.virtualDataSetId++;
    }

    copy() {
        let clone = this.CardFactory.create(this.dashboard, this.rawData);
        //hack: on new card create info map initialized from scratch, but we dont have all metrics filled properly yet.
        //so we just restore original metricInfoMap to let makeVirtual do the rest
        clone.metrics.metricInfoMap = angular.copy(this.metrics.metricInfoMap);

        clone.drill.drillableMetrics = this.drill.drillableMetrics;
        clone.columnPosition.init(this.rawData.columnPosition);
        clone.chartSettings.init(this.rawData.chartSettings);
        clone.formatting.init(this.rawData.formatting);
        
        return clone;
    }
    
    /**
     * clones itself to to virtual card, used for edit
     * @todo: replace with Normal method for virtualization, need deep debug
     */
    clone() {
        let clone = this.copy();
        clone.makeVirtual();
        
        return clone;
    }

    /**
     * makes current card virtual, refreshing all id's and relations to unlink from real persisted entities
     * @deprecated
     */
    makeVirtual() {
        this.virtualizedFromId = this.id;
        this.id = null;
        let formulaIdsMap = {},
            metricIdsMap = {};

        //create virtual id's for all dataSets
        this.metrics.forEach(dataSet => {
            const vId = this.nextVirtualId();
            metricIdsMap[dataSet.id] = vId;
            dataSet.virtualId = vId;
            return dataSet;
        });

        this.metrics.setVirtualIdMap(metricIdsMap);

        let formulas = [];
        //create virtual id's for all formulas
        this.formulas.forEach(formula => {
            //@todo: remove if duplicated in cardMetrics
            formula.data.virtualId = this.nextVirtualId();
            formulaIdsMap[formula.data.virtualId] = formula.data.id;
            formula.data.order = this.metrics.initialMetricInfoMap[`formula-${formula.data.id}`].order;
            formulas.push(formula);
        });

        this.formulas.setVirtualIdMap(formulaIdsMap);

        this.metrics.removeAllFormulas();
        formulas.forEach(formula => this.metrics.addFormula(formula));

        //update comparedTo to virtual id's
        this.compare.getList().forEach(compare => {
            if (compare.info.comparedToFormula) {
                let formula = this.formulas.getById(compare.comparedTo);
                let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                compare.comparedTo = dataSet.virtualId;
                compare.relationId = dataSet.virtualId;
            } else {
                const metrics = this.metrics;
                let byRelationId = metrics.getByRelationId(compare.comparedTo);
                if (!byRelationId) {
                    byRelationId = metrics.find(m => compare.id.indexOf(m.id) > 0);
                }
                compare.comparedTo = byRelationId.virtualId;
                compare.relationId = byRelationId.relationId;
            }
        });
        
        //update formatting to use virtualId's
        let clonedFormatting = this.rawData.formatting ? JSON.parse(JSON.stringify(this.rawData.formatting)) : null;
        
        clonedFormatting && this.formatting.init(clonedFormatting.map((item) => {
            
            item.columns = item.columns.map(column => {
                // For custom sql formatting we have string column names instead of objects
                // In that case conversion to virtual id's is not required at all
                if(!_.isObject(column)) return column;
                
                if(column.type === 'dimension') return column;
    
                if(column.type === 'formula') {
                    let formula = this.formulas.getById(column.id);
                    
                    if(formula) {
                        let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                        column.id = dataSet.virtualId;
    
                        return column;
                    }
                } else {
                    let metric = this.metrics.getByCompareId(column.id) || this.metrics.getByRelationId(column.id);
                    if(metric) {
                        column.id = metric.virtualId;
                    } else {
                        console.warn('Invalid formatting column. Could not find metric with id ' + column.id, this.rawData);
                    }
        
                    return column;
                }
            }).filter(column => !_.isEmpty(column));
    
            return item;
            
        }));
        
        //update columnPosition to use virtualId's
        let clonedPositions = this.rawData.columnPosition ? JSON.parse(JSON.stringify(this.rawData.columnPosition)) : null;
        
        clonedPositions && this.columnPosition.init(clonedPositions.map((position) => {
            if(position.type === 'dimension') return position;
            
            if(position.type === 'formula') {
                let formula = this.formulas.getById(position.id);
                let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                position.id = dataSet.virtualId;
    
                return position;
            } else {
                let metric = this.metrics.getByCompareId(position.id) || this.metrics.getByRelationId(position.id);
                if(metric) {
                    position.id = metric.virtualId;
                } else {
                    console.warn('Invalid column position. Could not find metric with id ' + position.id, this.rawData);
                }
    
                return position;
            }
        }));
        
        //update chartSettings metrics to use virtualId's
        let clonedSettings = this.rawData.chartSettings ? JSON.parse(JSON.stringify(this.rawData.chartSettings)) : null;
        
        if(clonedSettings && !_.isEmpty(clonedSettings)) {
            
            if(clonedSettings.metrics) {
                clonedSettings.metrics = clonedSettings.metrics.map((metric) => {
                    if(metric.type === 'formula') {
                        let formula = this.formulas.getById(metric.id);
                        let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                        metric.id = dataSet.virtualId;
            
                        return metric;
                    } else {
                        let item = this.metrics.getByCompareId(metric.id) || this.metrics.getByRelationId(metric.id);
                        if(item) {
                            metric.id = item.virtualId;
                        } else {
                            console.warn('Invalid chart settings metric. Could not find metric with id ' + metric.id, this.rawData);
                        }
            
                        return metric;
                    }
                });
            }
    
            if(clonedSettings.scatter) {
                if(clonedSettings.scatter.xAxisMetric) {
                    if(clonedSettings.scatter.xAxisMetric.type === 'formula') {
                        let formula = this.formulas.getById(clonedSettings.scatter.xAxisMetric.id);
                        let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                        clonedSettings.scatter.xAxisMetric.id = dataSet.virtualId;
                    } else {
                        let item = this.metrics.getByCompareId(clonedSettings.scatter.xAxisMetric.id) || this.metrics.getByRelationId(clonedSettings.scatter.xAxisMetric.id);
                        if(item) {
                            clonedSettings.scatter.xAxisMetric.id = item.virtualId;
                        } else {
                            console.warn('Invalid chart settings scatter.xAxisMetric. Could not find metric with id ' + clonedSettings.scatter.xAxisMetric.id, this.rawData);
                        }
                    }
                }
                
                if(clonedSettings.scatter.yAxisMetric) {
                    if(clonedSettings.scatter.yAxisMetric.type === 'formula') {
                        let formula = this.formulas.getById(clonedSettings.scatter.yAxisMetric.id);
                        let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                        clonedSettings.scatter.yAxisMetric.id = dataSet.virtualId;
                    } else {
                        let item = this.metrics.getByCompareId(clonedSettings.scatter.yAxisMetric.id) || this.metrics.getByRelationId(clonedSettings.scatter.yAxisMetric.id);
                        if(item) {
                            clonedSettings.scatter.yAxisMetric.id = item.virtualId;
                        } else {
                            console.warn('Invalid chart settings scatter.yAxisMetric. Could not find metric with id ' + clonedSettings.scatter.yAxisMetric.id, this.rawData);
                        }
                    }
                }
            }
            
            if(clonedSettings.bubble) {
                if(clonedSettings.bubble.xAxisMetric) {
                    if(clonedSettings.bubble.xAxisMetric.type === 'formula') {
                        let formula = this.formulas.getById(clonedSettings.bubble.xAxisMetric.id);
                        let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                        clonedSettings.bubble.xAxisMetric.id = dataSet.virtualId;
                    } else {
                        let item = this.metrics.getByCompareId(clonedSettings.bubble.xAxisMetric.id) || this.metrics.getByRelationId(clonedSettings.bubble.xAxisMetric.id);
                        if(item) {
                            clonedSettings.bubble.xAxisMetric.id = item.virtualId;
                        } else {
                            console.warn('Invalid chart settings bubble.xAxisMetric. Could not find metric with id ' + clonedSettings.bubble.xAxisMetric.id, this.rawData);
                        }
                    }
                }
                
                if(clonedSettings.bubble.yAxisMetric) {
                    if(clonedSettings.bubble.yAxisMetric.type === 'formula') {
                        let formula = this.formulas.getById(clonedSettings.bubble.yAxisMetric.id);
                        let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                        clonedSettings.bubble.yAxisMetric.id = dataSet.virtualId;
                    } else {
                        let item = this.metrics.getByCompareId(clonedSettings.bubble.yAxisMetric.id) || this.metrics.getByRelationId(clonedSettings.bubble.yAxisMetric.id);
                        if(item) {
                            clonedSettings.bubble.yAxisMetric.id = item.virtualId;
                        } else {
                            console.warn('Invalid chart settings bubble.yAxisMetric. Could not find metric with id ' + clonedSettings.bubble.yAxisMetric.id, this.rawData);
                        }
                    }
                }
            }
            
            if(clonedSettings.sankey) {
                if(clonedSettings.sankey.metric) {
                    if(clonedSettings.sankey.metric.type === 'formula') {
                        let formula = this.formulas.getById(clonedSettings.sankey.metric.id);
                        let dataSet = this.metrics.find(dataSet => dataSet.isFormula() && dataSet.virtualId === formula.data.virtualId);
                        clonedSettings.sankey.metric.id = dataSet.virtualId;
                    } else {
                        let item = this.metrics.getByCompareId(clonedSettings.sankey.metric.id) || this.metrics.getByRelationId(clonedSettings.sankey.metric.id);
                        if(item) {
                            clonedSettings.sankey.metric.id = item.virtualId;
                        } else {
                            console.warn('Invalid chart settings sankey.metric. Could not find metric with id ' + clonedSettings.sankey.metric.id, this.rawData);
                        }
                    }
                }
            }
        }
    
        this.chartSettings.init(clonedSettings);

        //update id's in formulas to virtual id's
        let virtualIdMap = this.formulas.getLettersJson();
        let lettersMap = _.invert(virtualIdMap);
        
        this.formulas.forEach((formula) => {
            formula.data.metrics = _.reduce(formula.data.metrics, (map, value, relationId) => {
                let letter = formula.data.metrics[relationId];
                let virtualId = lettersMap[letter];

                if(!virtualId){
                    let metric = this.metrics.getByRelationId(relationId);
    
                    if(metric) {
                        virtualId = lettersMap[virtualIdMap[metric.virtualId]];
                    } else {
                        console.warn(`Invalid formula letter ${letter}. Could not find metric with id ${relationId}`, formula);
                    }
                }

                map[virtualId] = letter;

                return map;
            }, {});
        });

        //updateFilters to use virtualId's
        this.filters.forEach(filter => {
            let metric = this.metrics.find(dataSet => dataSet.isRegular() && dataSet.relationId == filter.metric);
            if (metric) {
                filter.dataSetId = metric.virtualId;
            }
        });
    
        //update selectedTotals to use virtualId's
        this.selectedTotals = this.selectedTotals.reduce((totals, id) => {
            let metric = this.metrics.getByCompareId(id) || this.metrics.getByRelationId(id);
            if(metric) {
                totals.push(metric.virtualId);
            } else {
                console.warn('Invalid selected total. Could not find metric with id ' + id, this.rawData);
            }
    
            return totals;
        }, []);

        //update metricInfoMap to use virtualId's
        let infoMap = {};
        let columnsMap = {};
        this.metrics.forEach((metric, index) => {
            let metricId = this.getMetricIdFromJson(metric, formulaIdsMap);

            metric.info = _.cloneDeep(metric.info);
            
            if (!this.metrics.initialMetricInfoMap) {
                this.metrics.initialMetricInfoMap = {};
            }

            let metricInfo = this.metrics.initialMetricInfoMap[metricId];
            if (metricInfo && metricInfo.order !== undefined)
                metric.order = metricInfo.order;
            else
                metric.order = index;

            let info = this.metrics.metricInfoMap[metricId];
            let column = this.metrics.columnsMap[metricId];

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

    getMetricIdFromJson(metric, formulaIdsMap) {
        if (metric.isFormula()) {
            return MetricModel.getIdFromJson({
                formula: true,
                formulaId: formulaIdsMap[metric.formulaId]
            });
        }

        return metric.id;
    }

    metricIds() {
        return this.metrics.items.map(metric => metric.rawId);
    }

    hasData() {
        return this.metrics.getVisibleCount() && this.metrics.getVisibleMetrics().every(metric => {
            return !!metric.getData().length;
        });
    }

    cleanUserInfoMap() {
        return this.DataProvider.get(`card/cleanUpUserMapInfo/${this.id}`, false, false);
    }

    /**
     * saves current state to be reset later
     */
    saveState() {
        this.savedState = {
            description: this.description,
            name: this.name,
            rangeName: this.rangeName,
            selectedTotals: this.selectedTotals.slice() || [],
            cardExportInfos: this.cardExportInfos.slice() || [],
            yAxis: angular.copy(this.yAxis),
            xAxis: angular.copy(this.xAxis),
            multipleAxis: this.multipleAxis,
            noSort: this.noSort,
            showGroupingAsPercentage: this.showGroupingAsPercentage,
            showCompareStats: this.showCompareStats,
            showTableTotals: this.showTableTotals,
            isTransposeTable: this.isTransposeTable,
            timezone: this.timezone,
            useTimezone: this.useTimezone,
            startDayOfWeek: this.startDayOfWeek,
            useStartDayOfWeek: this.useStartDayOfWeek,
            fillChart: this.fillChart,
            showTrendLine: this.showTrendLine,
            extendTrendLine: this.extendTrendLine,
            goal: this.goal,
            showValueLabels: this.showValueLabels,
            columnSorting: this.columnSorting.getState(),
            columnPosition: this.columnPosition.getJson(),
            chartSettings: this.chartSettings.getJson(),
            fromDate: moment(this.fromDate),
            toDate: moment(this.toDate),
            moving: this.moving,
            frequencies: this.frequencies.getState(),
            types: this.types.getState(),
            metrics: this.metrics.getState(),
            groupings: this.groupings.getState(),
            formulas: this.formulas.getState(),
            filters: this.filters.getState(),
            drill: this.drill.getState(),
            image: this.image.getState()
        };
    }

    /**
     * restores previously saved state
     */
    restoreState() {
        if (!this.savedState) return;
        var state = this.savedState;
        this.savedState = null;

        //don't do any validation or run setters logic, suggesting state is perfectly valid and maps to properties.
        this.description = state.description;
        this.name = state.name;
        this.rangeName = state.rangeName;
        this.selectedTotals = state.selectedTotals;
        this.cardExportInfos = state.cardExportInfos;
        this.yAxis = state.yAxis;
        this.xAxis = state.xAxis;
        this.multipleAxis = state.multipleAxis;
        this.noSort = state.noSort;
        this.showGroupingAsPercentage = state.showGroupingAsPercentage;
        this.showCompareStats = state.showCompareStats;
        this.showTableTotals = state.showTableTotals;
        this.isTransposeTable = state.isTransposeTable;
        this.timezone = state.timezone;
        this.useTimezone = state.useTimezone;
        this.startDayOfWeek = state.startDayOfWeek;
        this.useStartDayOfWeek = state.useStartDayOfWeek;
        this.fillChart = state.fillChart;
        this.showTrendLine = state.showTrendLine;
        this.extendTrendLine = state.extendTrendLine;
        this.goal = state.goal;
        this.showValueLabels = state.showValueLabels;
        this.fromDate = state.fromDate;
        this.toDate = state.toDate;
        this.moving = state.moving;
        this.frequencies.setState(state.frequencies);
        this.types.setState(state.types);
        this.groupings.setState(state.groupings);
        this.formulas.setState(state.formulas);
        this.filters.setState(state.filters);
        this.drill.setState(state.drill);
        this.metrics.setState(state.metrics);
        this.image.setState(state.image);
        this.columnSorting.setState(state.columnSorting);
        this.columnPosition.init(state.columnPosition);
        this.chartSettings.init(state.chartSettings);
    }

    getMetricFromAlert(alert){
        var formulaId = alert.formulaId;
        if(this.isVirtual()){
            formulaId = this.formulas.getVIdFromReal(alert.formulaId);
        }

        return alert.cardMetricRelationId
            ? this.metrics.getByRelationId(alert.cardMetricRelationId)
            : this.metrics.getByFormulaId(formulaId)
    }

    initPositioning(gridsterItem) {
        this.positioning.initBy(gridsterItem);
    }

    getJson() {
        var type = this.types.get();

        let sortedMetricsJson = ColumnHelper.sortedMetrics(this.metrics)
            .map((item, idx) => {
                var res = item.getJson();
                var id = res.virtualId;
                if (!id && this.metrics._virtualIdMap && item.id) {
                    res.virtualId = this.metrics._virtualIdMap[item.id];
                }
                res.position = idx;
                return res;
            });

        sortedMetricsJson.forEach(metric => {
            if (metric.formula && metric.formula.virtualId) {
                let correspondingFilter = this.formulas.find(f => f.data.id === metric.formula.virtualId);
                if (correspondingFilter) {
                    metric.formula.virtualId = correspondingFilter.data.virtualId;
                }
            }
        });

        let formulasIds = this.formulas.map(i => i.data.virtualId);
        sortedMetricsJson = sortedMetricsJson.filter(i => !(i.formula && i.formula.virtualId && formulasIds.indexOf(i.formula.virtualId) === -1));

        // hack for comparable
        let virtualIdArray = _.keys(this.metrics._virtualIdMap);
        sortedMetricsJson.forEach((item, index) => {
            let comparable = item.comparable;
            if (comparable && !comparable.dataSet) {
                let virtualIdString = virtualIdArray[index];
                virtualIdArray.forEach(label => {
                    if (virtualIdString.indexOf(label) > 1) {
                        comparable.dataSet = {virtualId: this.metrics._virtualIdMap[label]};
                    }
                });
            }
        });

        return {
            //date props
            rangeName: this.rangeName,
            fromDate: +this.fromDate,
            toDate: +this.toDate,
            cohortFromDate: +this.cohort.fromDate,
            cohortToDate: +this.cohort.toDate,
            cohortRangeName: this.cohort.rangeName,
            customDateMap: this.customDateMap.getJson(),
            description: this.description,
            name: this.name,
            subType: this.types.subType,
            selectedTotals: this.selectedTotals || [],
            cardExportInfos: this.cardExportInfos || [],
            type: type,
            yAxis: this.yAxis,
            xAxis: this.xAxis,
            multipleAxis: this.multipleAxis,
            noSort: this.noSort,
            showGroupingAsPercentage: this.showGroupingAsPercentage,
            showCompareStats: this.showCompareStats,
            showTableTotals: this.showTableTotals,
            isTransposeTable: this.isTransposeTable,
            timezone: this.timezone,
            useTimezone: this.useTimezone,
            startDayOfWeek: this.startDayOfWeek,
            useStartDayOfWeek: this.useStartDayOfWeek,
            fillChart: this.fillChart,
            showTrendLine: this.showTrendLine,
            extendTrendLine: this.extendTrendLine,
            goal: this.goal,
            showValueLabels: this.showValueLabels,
            availableTypes: ['line', 'bar'],
            columnsSort: this.columnSorting.sortOrder,
            selectedFrequency: this.frequencies.selected,
            metricInfoMap: this.prepareMetricInfoMap(),
            visualOrderInfo: this.visualOrderInfo || {},
            dataSets: sortedMetricsJson,
            groupBys: this.groupings.getJson(),
            formulas: this.formulas.getJson(),
            filters: this.filters.getJson(),
            image: this.image.getJson(),
            owner: {
                id: this.Auth.user.id
            },
            letters: this.formulas.getLettersJson(),
            moving: this.moving,
            size: this.size || null,
            text: this.text || null
        };
    }

    metricsAreLoading() {
        return !this.metrics.loaded;
    }

    isImage() {
        return !this.hasVisibleMetricsOrFormulas() && this.image.exists();
    }

    isDraft() {
        if(this.isText()) return false;

        return !this.isPartial && !this.hasVisibleMetricsOrFormulas() && !this.image.exists();
    }

    isImageOrDraft() {
        return this.isImage() || this.isDraft();
    }

    isText() {
        return this.types.get() === 'text';
    }

    hasVisibleMetricsOrFormulas() {
        return this.metrics.getVisibleCount() || this.formulas.length;
    }

    getCardQuery() {
        return this.query;
    }

    getDataUpdated() {
        return this.dataUpdated;
    }
    
    hasGoal() {
        return this.goal !== null;
    }
}
