'use strict';

import {EventEmitter} from '../../system/events.js';

class CardDrill extends EventEmitter {
    constructor(card, DataProvider, $q, toaster) {
        super();
        this.$q = $q;
        /** @type {Card} */
        this.card = card;
        this.toaster = toaster;
        this.DataProvider = DataProvider;

        this.maps = [];
        this.loading = false;
        this.activeMap = null;
        this.drillPoints = [];
        this.cardDrillMap = null;
        this.savedGroupings = null;
        this.drillableMetrics = [];
    }

    getMetric() {
        if (!this.activeMap) return null;
        return this.card.metrics.getByRelationId(this.activeMap.relationId);
    }

    init(cardData) {
        this.setDrillMap(cardData.drillMaps || {});
    }

    getActiveLevel() {
        return this.drillPoints.length - 1;
    }

    getType() {
        if (!this.activeMap) return null;
        var type = this.activeMap.levels[this.drillPoints.length - 1].chartType;
        if (type == 'table-total') type = 'table';
        return type;
    }

    /** @private */
    doReset() {
        this.activeMap = null;
        this.drillPoints.length = 0;

        this.restoreState();
        this.trigger('reset');
        this.loading = false;
    }

    reset(skipReload = false) {
        if (!this.activeMap) return;
        this.loading = true;
        if (this.drillPoints.length >= 0 && !skipReload) {
            this.activeMap = null; //to anticipate metrics.items watcher in chart directive which triggered first.
            this.restoreState();
            return this.card.metrics.reloadData().then(() => this.doReset());
        } else {
            this.doReset();
        }
    }

    startCardDrill() {
        this.startDrill(this.cardDrillMap);
    }

    selectMetric(metric) {
        this.startDrill(this.maps.find(map => map.relationId == metric.relationId));
    }

    startDrill(map) {
        this.reset(true);
        this.saveState();
        this.card.metrics.setPage(1);
        this.drillDown(null, map).catch(() => {
            this.activeMap = null;
        });
    }

    isActive() {
        return !!this.activeMap;
    }

    hasMaps() {
        return this.maps.length > 0 || this.cardDrillMap;
    }

    drillDown(value, map) {
        map = map || this.activeMap;
        if (this.loading || !this.hasMaps() || !map || this.drillPoints.length >= map.levels.length
            || map.levels[this.drillPoints.length].operation == 'grain' && this.card.metrics.length > 1) {
            return this.$q.reject();
        }

        var points = this.drillPoints.slice();
        if (points.length) points[points.length - 1] = value;
        points.push(null);

        return this.doDrill(points, map).then(() => {
            this.trigger('drillDown');
        }).catch((e) => {
            console.error(e);
            this.toaster.error('Drill down failed');
            return this.$q.reject(e);
        });
    }

    drillUp() {
        var map = this.activeMap;
        if (this.loading || !this.hasMaps() || !map || this.drillPoints.length === 0) return this.$q.reject();

        var points = this.drillPoints.slice();
        points.pop();
        if (points.length) {
            points[points.length - 1] = null;
            return this.doDrill(points, map).then(() => {
                this.trigger('drillUp');
            }).catch((e) => {
                console.error(e);
                this.toaster.error('Drill up failed');
                return this.$q.reject(e);
            });
        } else {
            return this.reset();
        }
    }

    reload() {
        return this.doDrill(this.drillPoints.slice(), this.activeMap);
    }

    isCardDrill() {
        return this.isActive() && this.activeMap == this.cardDrillMap;
    }

    doDrill(points, map) {
        this.loading = true;

        // We only operate on virtual cards when drilling
        if(!this.card.isVirtual()) this.card.makeVirtual();
    
        var params = {
            page: this.card.metrics.page,
            card: this.card.getJson(),
            drillPoints: points
        };

        if (map == this.cardDrillMap) {
            params.cardId = this.card.id;
        } else {
            params.relationId = map.relationId;
        }
    
        this.card.columnSorting.sortOrder = [];

        return this.DataProvider.post('drillMap/drill/', params, false).then(response => {
            this.activeMap = map;
            this.drillPoints.length = 0;
            points.forEach((value, idx) => this.drillPoints[idx] = value);
            var columns = this.activeMap.levels.filter(level => level.operation == 'groupby').map(level => level.column);
            this.card.groupings.setFromColumns(columns);
            this.card.metrics.handleLoadResponse({}, response);
        }).finally(() => {
            this.card.metrics.trigger('loaded');
            this.loading = false;
        });
    }

    saveState() {
        this.savedType = this.card.types.getState();
        this.savedGroupings = this.card.groupings.getState();
        this.savedPage = this.card.metrics.page;
    }

    restoreState() {
        if(this.savedType) {
            this.card.types.setState(this.savedType);
            this.savedType = null;
        }
    
        if(this.savedGroupings) {
            this.card.groupings.setState(this.savedGroupings);
            this.savedGroupings = null;
        }
        
        if(this.savedPage) {
            this.card.metrics.setPage(this.savedPage);
            this.savedPage = null;
        }
    }

    isTotal() {
        if (!this.isActive()) return false;
        var level = this.activeMap.levels[this.getActiveLevel()];
        return level.chartType == 'bar' || level.chartType == 'table-total';
    }

    isGrain() {
        if (!this.isActive()) return false;
        return this.activeMap.levels[this.getActiveLevel()].operation == 'grain';
    }

    setCardDrillMap(map) {
        var reset = false;
        if (this.isCardDrill() && (!map || map.id != this.cardDrillMap.id)) {
            reset = true;
        }
        if (this.isCardDrill()) {
            this.activeMap = map;
        }
        this.cardDrillMap = map || null;
        if (reset) this.reset();
    }

    setDrillMap(serverResponse) {
        this.setCardDrillMap(serverResponse.card || null);
        this.maps.length = 0;
        this.drillableMetrics.length = 0;
        var relMaps = serverResponse.relations || [];
        relMaps.forEach(map => {
            this.maps.push(map);
            this.drillableMetrics.push(this.card.metrics.getByRelationId(map.relationId));
        });
        if (!this.isCardDrill() && this.maps.length === 0) this.reset();
    }

    isDrillable(relation) {
        return !!this.drillableMetrics.find(metric => metric && relation && metric.relationId == relation.relationId);
    }

    hasCardDrillMap() {
        return !!this.cardDrillMap;
    }

    getState() {
        //we do not care about current drill state as this is used in CB only atm
        return {
            cardDrillMap: angular.copy(this.cardDrillMap),
            maps: angular.copy(this.maps)
        };
    }

    setState(state) {
        this.cardDrillMap = state.cardDrillMap;
        this.maps = state.maps;
    }

    addLevel(level) {
        if (!this.cardDrillMap) {
            this.cardDrillMap = {
                levels: []
            };
        }
        if (level.column && this.cardDrillMap.levels.find(l => l.column && l.column.id == level.column.id)) return false;

        return this.cardDrillMap.levels.push(level);
    }

    removeLevel(index) {
        this.cardDrillMap.levels.splice(index, 1);
        if (this.cardDrillMap.levels.length === 0) this.cardDrillMap = null;
    }
    
    removeLevels(levels = []) {
        levels.forEach(level => {
            let index = this.cardDrillMap.levels.findIndex(item => item.column.name === level.column.name);
    
            // If level exists we will remove it
            if(index >= 0) this.removeLevel(index);
        });
    }

    getJson() {
        return this.cardDrillMap ? {
            levels: this.cardDrillMap.levels.map(level => {
                var res = {
                    operation: level.operation,
                    chartType: level.chartType
                };
                if (level.column) {
                    res.columnId = level.column.id;
                }
                return res;
            })
        } : null;
    }
}

truedashApp.service('CardDrillFactory', (DataProvider, $q, toaster) => ({
    create: (card) => { return new CardDrill(card, DataProvider, $q, toaster)}
}));
