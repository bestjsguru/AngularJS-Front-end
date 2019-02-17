'use strict';

import {EventEmitter} from '../../system/events.js';
import {AxisInfo} from '../../common/axisInfo.model.js';

export const METRIC_TYPE = {
    SQL_BASED: 'sqlTable',
    DYNAMIC: 'dynamicRelation'
};

/**
 * TODO: this will be converted to DataSet
 * Dataset could be for regular metric, compare and formula
 * compare could be defined on regular metric and on formula
 * formula could be defined on regular metric and compare
 * if formula defined on compare, another compare could not be defined on that formula
 * if compare defined on formula, formula can not be defined on compare
 * all datasets contains virtualId atm.
 *
 *
 */
export class MetricModel extends EventEmitter {
    constructor(metricJson, dataSet, dateRangeService, Auth, UserService) {
        super();
        /** @type {DateRangeService} */
        this.dateRangeService = dateRangeService;
        this.UserService = UserService;
        this.Auth = Auth;

        /**
         * this FE-related id of metric model. it does not have corresponding BE field
         * we use this since in our models different kind of entities mixed
         * with different logic applied - formulas, compares, duplicated metrics, etc.
         * And their id's could overlap, or could be same for some reason.
         * but id property of MetricModel should be unique, so we have synthetic FE id
         * when doing/receiving requests from BE corresponding field should be used
         * rawId for metric entity id, formulaId for formula, relationId for cardMetricRelationId, etc.
         * this field is FOR USE ON FE ONLY
         * in simple case it equals rawId, but using it as rawID in API requests should be avoided
         * in sake of clarity.
         * @type {String}
         */
        this.id = null;
        /**
         * this is ID of Metric DB entity on BE
         * should be used when we want to specify metric itself
         * @type {Number}
         */
        this.rawId = null;

        /**
         * this is ID of cardMetricRelationId object, which specifies card-bound metric entry
         * it could have same rawId if metric added multiple times to same card,
         * or it can absent if metric model is not part of the any card.
         * @type {Number}
         */
        this.relationId = null;

        /**
         * This is ID of formula. then it is set, formula property of metric model is set to true.
         * @type {Number}
         */
        this.formulaId = null;

        /**
         * virtual id used for datasets in virtual card
         */
        this.virtualId = null;

        this.isIncrease = null;

        this.isColoring = null;

        this.convertFromJson(metricJson);

        this.setData(dataSet);
        this.initColumns();
    }

    setData(data) {
        this.rawData = data;
        this.initData();
    }

    /** @private */
    convertFromJson(json) {
        this.virtualId = json.virtualId;
        this.info = json;
        this.$oldSource = json.source; //@todo: delete
        this.description = json.description;
        this.columns = json.columns || [];
        this.id = MetricModel.getIdFromJson(json);
        this.active = !!json.active;
        this.rawId = json.id;
        this.relationId = json.relationId;
        this.complexity = json.complexity;
        this.formulaId = json.formulaId;
        this.comparable = json.comparable;
        this.comparedTo = json.comparedTo;
        this.type = json.type ? json.type.toLowerCase() : null;
        this.color = json.color || null;
        this.letter = json.letter || null;
        this.owner = json.owner;
        this.cumulativeFunction = json.cumulativeFunction || null;
        this.isIncrease = json.isIncrease !== undefined ? json.isIncrease : true;
        this.numberOfDecimals = _.isNumber(json.numberOfDecimals) ? json.numberOfDecimals : null;
        this.isColoring = json.isColoring;
        this.table = json.table;
        
        if (this.isFormula()) {
            this.calculatedOnCompares = json.calculatedOnCompares;
        }

        //@todo: replace to own class
        if (this.comparable)
            this.compareDates = {fromDate: json.fromDate, toDate: json.toDate};

        this.setStatement(json.statement);
        this.setName(json.name);
        this.filtersRule = json.rule ? json.rule.replace(/\s([\(\)])\s/g, '$1') : '';
        //this.setDrillMap(json.drillMap);
    }

    // Because of some Mongo issues we have to convert encoded characters
    setStatement(statement) {
        var isString = typeof statement === 'string';
        this.statement = isString ? statement.replaceAll('&lt;', '<').replaceAll('&gt;', '>') : '';
    }

    // HACK updateMetricName is used inside "cardMetrics -> getMetricBasedData"
    // We need this param to correctly generate formula names when groupings are applied
    setName(name, updateMetricName = false) {
        this.name = name;
        this.label = this.name || 'Unknown';

        // Generate correct metric label for formulas
        if(this.isFormula() && !(this.hasGroupings() && updateMetricName)) {
            this.label = this.getFormulaTitle();
        }
    }

    /** @private */
    initData() {
        var data = this.rawData;
        if (data == null) {
            this.data = [];
            return;
        }

        if (this.getType() == 'map') data = data.results;
        //make copy of array since it could be spliced.
        this.data = _.clone(data);

        // Convert all result values to floats because Highchart cannot work with strings
        this.data = this.data.map((value) => {
            if(!_.isNull(value[1])) value[1] = parseFloat(value[1]);

            return value;
        });
    }

    resetColumns() {
        this.columns = [];
        this.initColumns();
    }

    initColumns() {
        if (this.columns.length) {
            this.columns = this.columns.map(name => {
                return {
                    title: name
                };
            });
            if (!this.isTable())
                this.columns.unshift({
                    title: 'Date'
                });
            return;
        }

        if (!this.isTable() || !this.data.columns) {
            this.columns = [
                {title: 'Date'},
                {title: this.label}
            ];
        } else {
            this.columns = this.data.columns.map(name => {
                return {
                    title: name
                };
            });
        }
    }

    static getIdFromJson(json) {
        if (json.virtualId) return json.virtualId;
        return this.getNonVirtualId(json);
    }

    static getNonVirtualId(json) {
        let id = json.id;

        if (json.formula) {
            id = `formula-${json.formulaId}`;
        } else if (json.relationId) {
            // When we add duplicated metrics this is ID that we are getting from BE
            //relation is added to distinguish from rawId to avoid confusing usage and have errors trigged
            //because metric.id could be sometimes relation, sometimes not and it is incorrect to use it
            //in places where relationId required
            id = `relation-${json.relationId}`;
        }
        if (json.comparable) {
            id = `comparable-relation-${json.comparedTo}-${json.compareId}`;
        }

        // fix of the bug wen you looking for comparable-formula-xxx-xxx bug get comparable-relation-xxx-xxx
        if (json.comparedToFormula) {
            id = `comparable-formula-${json.comparedTo}-${json.compareId}`;
        }

        return id;

    }

    getName() { return this.name; }

    getRangeName() { return this.info.rangeName; }

    isComparable() { return this.info.comparable; }

    isRegular() { return !this.isComparable() && !this.isFormula(); }

    getDescription() { return this.info.description; }

    getFormulaTitle() {
        var name = this.info.formulaName || this.name;
        return name ? name : this.info.title + ' (Formula)';
    }

    isHidden() { return this.info.hidden; }
    
    hide() {
        this.info.hidden = true;
    }
    
    show() {
        this.info.hidden = false;
    }

    isFormula() { return this.info.formula; }

    isCohort() { return this.info.cohort === true; }

    isCumulative() { return this.cumulativeFunction && this.cumulativeFunction.length > 0; }

    toggleCumulativeStatus() {
        if (this.isCumulative()) {
            this.cumulativeFunction = null;
        } else {
            this.cumulativeFunction = 'SUM';
        }
    }

    toggleColoring() {
        this.isColoring = !this.isColoring;
    }

    hasGroupings() { return this.info.columnGroupings && this.info.columnGroupings.length; }

    getData() { return this.data; }

    getId() {
        return this.id || _.result(this, '$parent.id', null);
    }

    getType() {
        if (!this.type) return this.type;
        return this.type.toLowerCase();
    }

    isOwnedByCurrentUser() {
        if (!this.Auth.isLoggedIn()) return false;
        return this.owner === this.Auth.user.id;
    }

    isTable() {
        return ['table'].indexOf(this.getType()) > -1;
    }

    getSubType() {
        if (!this.info.subType) return this.getType();
        return this.info.subType.toLowerCase();
    }

    setSubType(subType) {
        this.info.subType = subType;
    }

    getXAxisInfo() {
        return this.info.xAxis || new AxisInfo(this.info.subType, this.info.symbol);
    }

    setXAxisInfo(info = {}) {
        this.info.xAxis = new AxisInfo(info.type, info.symbol);
    }

    getYAxisInfo() {
        let info = this.info.yAxis || new AxisInfo(this.info.subType, this.info.symbol);
        
        if(this.isFormula()) {
            let formulaType = AxisInfo.getTypeWithSymbol(this.info.type);
            
            if(formulaType) {
                info = new AxisInfo(formulaType, this.info.type);
            }
        }
        
        if(info.type === 'numeric') info.symbol = '123';
        if(info.type === 'time') info.symbol = 'time';
        
        return info;
    }

    setYAxisInfo(info = {}) {
        this.info.yAxis = new AxisInfo(info.type, info.symbol);
    }

    getUnitInfo() {
        return this.info.subType && new AxisInfo(this.info.subtype || this.info.subType, this.info.symbol);
    }

    getFormattingInfo(){
        return this.getYAxisInfo() || this.getUnitInfo();
    }

    clear() {
        this.rawData = null;
        this.data = [];
        this.info = {};
        this.label = 'Unknown';
    }

    isComparedTo(metric) {
        if (this.info.comparedToFormula) return this.comparedTo == (metric.virtualId || metric.formulaId);
        return this.comparedTo == (metric.virtualId || metric.relationId);
    }

    getDateFieldIndex() {
        return this.info.dateFieldIndex || 0;
    }

    getJson() {
        var json = {};
        
        if (this.isComparable()) {
            json = this.getComparableJson();
        } else if (this.isFormula()) {
            json = this.getFormulaJson();
        } else {
            json = this.getRegularJson();
        }
        
        if (this.filtersRule != null && this.filtersRule !== '') {
            json.filtersRule = this.filtersRule.replace(/([\(\)])/g, ' $1 ');
        }
        
        // json.id = this.rawId;
        json.relationId = this.relationId;
        json.formulaId = this.formulaId;
        json.virtualId = this.virtualId;
        json.hidden = this.info.hidden;
        json.name = this.label;
        json.color = this.color;
        json.letter = this.letter;
        json.cumulativeFunction = this.cumulativeFunction;
        json.isIncrease = this.isIncrease;
        json.numberOfDecimals = this.numberOfDecimals;
        json.isColoring = this.isColoring;
        
        json.xAxis = this.getXAxisInfo();
        json.yAxis = this.getYAxisInfo();
        
        return json;
    }

    getCumulativeJson() {
        return {
            virtualId: this.virtualId,
            cumulativeFunction: this.cumulativeFunction
        };
    }

    getComparableJson() {
        return {
            comparable: {
                rangeName: this.getRangeName(),
                dataSet: {
                    virtualId: this.comparedTo
                },
                fromDate: this.compareDates.fromDate,
                toDate: this.compareDates.toDate
            }
        };
    }

    getFormulaJson() {
        return {
            formula: {
                virtualId: this.virtualId
            }
        };
    }

    getRegularJson() {
        return {
            metric: {
                id: this.rawId
            }
        };
    }

    getAvailableColumns(){
        // sometimes we may get null instead of empty array so we make sure we have array in all cases
        return Array.isArray(this.info.availableColumns) ? this.info.availableColumns : [];
    }

    getSource() {
        let source = '';

        if (this.info.source) {
            source = {name: this.info.source};
        }
        
        if (_.isEmpty(source)) {
            source = {name: 'Without source'};

            if(this.isSQLBased()) source = {name: 'Custom SQL metrics'};
        }

        return source;
    }


    get source(){
        return this.getSource().name;
    }

    set source(value){} //plug

    transformToClone(){
        this.name = 'Clone of ' + this.name;
        this.$parent = {
            id: this.id
        };
        delete this.id ;
    }

    isSQLBased(){
        return this.complexity === METRIC_TYPE.SQL_BASED || this.complexity === 'nested';
    }

    isMap(){
        return this.getType() === 'map';
    }

    filterAvailableColumns(mapId){
        this.info.availableColumns = this.info.availableColumns.filter(col => {
            return !(col.availableColumn.id in mapId);
        });
    }

    isSaved(){
        return !!this.rawId;
    }
}
