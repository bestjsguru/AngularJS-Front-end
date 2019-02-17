'use strict';

import {EventEmitter} from '../../system/events.js';

class CardTypes extends EventEmitter {
    constructor(card, DataProvider) {
        super();
        this.card = card;
        this.type = '';
        this.subType = '';
        this.DataProvider = DataProvider;
        this.available = [];
    }

    init(cardData) {
        cardData.availableTypes = ['table', 'line', 'spline', 'symbol', 'mixed', 'bar', 'horizontal', 'pie', 'donut', 'funnel'];
    
        this.available = cardData.availableTypes ? cardData.availableTypes.map(type => Array.isArray(type) ? type[0] : type) : [];
        this.type = cardData.type ? cardData.type.toLowerCase() : '';
        this.subType = cardData.subType || '';
    }

    set(type, subType) {
        if (this.type === type && this.subType === subType) return true;
        let res = true;

        this.type = type;
        this.subType = subType;

        if(type === 'bubble') {
            // Bubble charts look much better when filled so we will enable fill chart by default every time you choose bubble chart
            let settings = this.card.chartSettings.getJson();
            
            if(!settings.fillChart) {
                settings.fillChart = true;
                this.card.chartSettings.init(settings);
            }
        } else if (type === 'funnel' && !this.card.frequencies.isTotalSelected()) {
            res = {message:'Frequency has been changed to "Total"'};
            this.card.frequencies.setState({selected: 'Total'});
        } else if (!['numeric', 'funnel', 'table', 'map', 'bar', 'horizontal'].includes(type) && this.card.frequencies.isTotalSelected()) {
            // If we try to change type to anything other than numeric, funnel, table, pie or donut
            //this.card.frequencies.setOld();
        } else if (['numeric', 'gauge'].includes(type)) {
            if (!this.card.frequencies.isTotalSelected()) {
                res = {message:'Frequency has been changed to "Total"'};
                this.card.frequencies.setState({selected: 'Total'});
            }
        } else if (type === 'table' && this.card.frequencies.isTotalSelected()) {
            // If we try to change type to table

            if (this.card && this.card.metrics && this.card.groupings && this.card.frequencies && this.card.frequencies.available) {
                if (this.card.metrics.length === 1 && this.card.groupings.length === 0) {
                    this.card.frequencies.setState({selected: this.card.frequencies.default});
                    res = {message:'Frequency has been changed'};
                }
            } else {
                console.warn("card with id =" + this.card.id + " has no metrics or groupings or frequencies or available frequencies but try to use them");
            }
        }

        this.card.metrics.initMetricInfo();
        this.card.initCardTable();
        this.trigger('updated');
        return res;
    }

    get() {
        return this.type;
    }

    isTable() {
        return this.type === 'table';

    }
    
    isMixed() {
        return this.subType === 'mixed';
    }

    getState() {
        return {
            type: this.type,
            subType: this.subType
        };
    }

    setState(state) {
        this.type = state.type;
        this.subType = state.subType;
    }
}

truedashApp.factory('CardTypesFactory', (DataProvider) => ({
    create: (card) => new CardTypes(card, DataProvider)
}));
