'use strict';

import {EventEmitter} from '../../system/events.js';
import {Helpers} from '../../common/helpers';

const NORMAL_LIST = ["Yearly", "Quarterly", "Monthly", "Weekly", "Daily"];
const HOURLY_LIST = [...NORMAL_LIST, "Hourly"];

class CardFrequencies extends EventEmitter {
    /**
     * @param {Card} card
     */
    constructor(card) {
        super();
        this.card = card;
        this.available = [];
        this.selected = null;
        this.oldSelected = null;
        this.default = 'Monthly';
    }

    is(frequency) {
        return frequency === this.selected;
    }

    isTotalSelected() {
        return this.is('Total');
    }

    isGrainSelected() {
        return this.is('Grain');
    }

    set(frequency, refresh = true) {
        if(this.is(frequency)) return;

        let chartType = this.card.types.type;
        let countOfGroupings = this.card.groupings.length;

        if (frequency === 'Total') {
            if (['pie', 'donut', 'funnel', 'bar'].includes(chartType)) {
                // We do nothing because we assume that pie, donut and funnel can always display total frequency
            } else if ((this.card.metrics.length > 1 || this.card.groupings.length > 0) && chartType !== 'map') {
                // If we have more than one metric than we set type to table as default
                this.card.types.set('table', 'table');
            } else if ((chartType !== 'table' || this.card.metrics.length == 1)  && chartType !== 'map') {
                // And if we have only one metric we set it to numeric
                this.card.types.set('numeric', 'numeric');
            }
        } else if (chartType === 'numeric') {
            this.card.types.set('line', 'line');
        } else if (frequency == 'None') {
            this.card.types.set('table', 'table');
        }

        if (frequency !== 'Total' && countOfGroupings === 1 && chartType === 'map') {
            frequency = 'Total';
        }

        this.oldSelected = this.selected;
        this.selected = frequency;

        if ((this.isTotalSelected() || this.oldSelected === 'Total') && !this.is(this.oldSelected)) {
            //delete columns sorting information if freq change from total to another type and vice versa
            this.card.columnSorting.sortOrder = [];
        }

        this.trigger('updated');

        // We need to refresh page counter when frequency changes
        let promise = this.card.metrics.setPage(1);

        return refresh ? promise.then(() => this.card.metrics.loadData()) : promise;
    }

    setOld() {
        if (this.oldSelected && this.available.find(item => item.toLowerCase() == this.oldSelected.toLowerCase()))
            this.set(this.oldSelected);
        else
            this.set(this.default);
    }

    static isPieOrDonut(type){
        return ['pie', 'donut'].indexOf(type) > -1;
    }

    init(cardData) {
        this.available = cardData.availableFrequencies || [];
        this.selected = cardData.selectedFrequency;
    }

    updateAvailable() {
        this.available = this.card.metrics.getRegular().some(metric => {
            return metric.info.frequencies ? metric.info.frequencies.indexOf('Hourly') == -1 : true;
        }) ? NORMAL_LIST : HOURLY_LIST;

        this.trigger('listUpdated');
    }

    getState() {
        return {
            selected: this.selected
        };
    }

    setState(state) {
        this.oldSelected = this.selected;
        this.selected = state.selected;
    }

    getFrequencyDateFormat() {
        let formats = {
            hourly: '%H:%M',
            daily: '%e. %b',
            weekly: '%e. %b',
            monthly: '%b \'%y',
            quarterly: '%Q  %Y',
            yearly: '%Y'
        };
        
        return formats[this.selected.toLowerCase()];
    }
    
    getTooltipFrequencyDateFormat() {
        let formats = {
            quarterly: '%Q  %Y',
        };
        
        return formats[this.selected.toLowerCase()];
    }
    
    convertToSentence(range) {
        let sentence = {
            hourly: 'by Hour',
            daily: 'by Day',
            weekly: 'by Week',
            monthly: 'by Month',
            quarterly: 'by Quarter',
            yearly: 'by Year',
            total: 'Total',
        };
        
        // For total frequency we will prepend the value
        if(this.isTotalSelected()) return sentence[this.selected.toLowerCase()] + ' ' + range;
        
        return range + ' ' + sentence[this.selected.toLowerCase()];
    }
    
    splitDateRangeToIntervals(from, to) {
        let interval = {
            hourly: 'hour',
            daily: 'day',
            weekly: 'week',
            monthly: 'month',
            quarterly: 'quarter',
            yearly: 'year',
        };
        
        if(this.selected.toLowerCase() === 'weekly') {
            from = this.generateWeekRangeStart(from);
        }
    
        let range = moment.range(from, to);
    
        let intervals = Array.from(range.by(interval[this.selected.toLowerCase()]));
        return intervals.map(interval => this.getIntervalFromDate(interval));
    }
    
    generateWeekRangeStart(from) {
        let fromDateString = Helpers.formatToDateString(moment(from));
        
        let selectedDay = moment(fromDateString).day();
        let weekStartDay = _.get(this.card, 'dashboard.usedStartDayOfWeek', 1) % 7;
        
        let diff = selectedDay >= weekStartDay ? 0 : (selectedDay + 1);
        
        // This is custom case when week starts on Sunday and we click on Sunday
        if(!selectedDay && !weekStartDay) diff = -1;
        
        return moment(fromDateString).subtract(diff, 'day').startOf('isoWeek').add(weekStartDay - 1, 'day');
    }
    
    getIntervalFromDate(date) {
        let dateFormatFn = Helpers.formatDate(this.selected.toLowerCase(), {isPieDonut: true, withYear: true});
        
        let from, to;
        
        switch (this.selected.toLowerCase()) {
            case 'hourly':
                from = moment(date).startOf('hour');
                to = moment(date).endOf('hour');
                break;
            case 'daily':
                from = moment(date).startOf('day');
                to = moment(date).endOf('day');
                break;
            case 'weekly':
                let fromDateString = Helpers.formatToDateString(moment(date));
    
                let selectedDay = moment(fromDateString).day();
                let weekStartDay = _.get(this.card, 'dashboard.usedStartDayOfWeek', 1) % 7;
    
                let diff = selectedDay >= weekStartDay ? 0 : (selectedDay + 1);
    
                // This is custom case when week starts on Sunday and we click on Sunday
                if(!selectedDay && !weekStartDay) diff = -1;
                
                from = moment(date).subtract(diff, 'day').startOf('isoWeek').add(weekStartDay - 1, 'day');
                to = moment(date).subtract(diff, 'day').endOf('isoWeek').add(weekStartDay - 1, 'day');
                break;
            case 'monthly':
                from = moment(date).startOf('month');
                to = moment(date).endOf('month');
                break;
            case 'quarterly':
                from = moment(date).startOf('quarter');
                to = moment(date).endOf('quarter');
                break;
            case 'yearly':
                from = moment(date).startOf('year');
                to = moment(date).endOf('year');
                break;
        }
        
        return {
            label: dateFormatFn(from),
            from: +from,
            to: +to,
        };
    }
}

truedashApp.factory('CardFrequenciesFactory', () => ({
    create: (card) => new CardFrequencies(card)
}));
