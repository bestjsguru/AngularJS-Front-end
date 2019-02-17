'use strict';

import './columnEntity.model.js';
import './cardGrouping.model.js';
import {Collection} from '../../data/collection.js';
import {CardGrouping} from './cardGrouping.model';
import {ColumnHelper} from '../../card/datatable/column.helper.js';

class CardGroupings extends Collection {
    constructor(card, DataProvider, $q, ColumnEntityModel, MetricDataService, AppEventsService) {
        super();

        /** @type {Card} */
        this.card = card;
        this.DataProvider = DataProvider;
        this.ColumnEntityModel = ColumnEntityModel;
        this.AppEventsService = AppEventsService;
        this.MetricDataService = MetricDataService;
        this.$q = $q;
    }

    init(cardData) {
        this.clear();
        (cardData.groupings || []).forEach(item => this.addItem(this.create(item)));
    }

    /**
     * set temporarily groupings based on provided columns
     * todo: this is hack
     * @param columns
     */
    setFromColumns(columns) {
        this.clear();
        columns.forEach((column, idx) => {
            this.addItem(this.create({
                id: idx,
                column: column
            }));
        });
    }
    
    getSortedGroupings() {
        return this.card.metrics.originalData.columns.filter(column => column.title).map(column => {
            return this.card.groupings.find(grouping => {
                return column.title === (grouping.name || grouping.column.displayName || grouping.column.name);
            });
        });
    }
    
    create(params) {
        return new CardGrouping(params);
    }

    add(params) {
        var grouping = this.addItem(this.create(params));
        this.trigger('added');
        this.card.trigger('updated');
        this.card.invalidateFullInfo();

        this.AppEventsService.track('created-card-grouping');

        return this.card.metrics.loadData().then(() => grouping);
    }

    update(idx, data) {
        var grouping = this.get(idx);
        grouping.update(data);
        this.trigger('updated');
        this.card.trigger('updated');
        this.card.invalidateFullInfo();

        this.AppEventsService.track('updated-card-grouping');

        return this.card.metrics.loadData().then(() => grouping);
    }

    remove(idx) {
        var grouping = this.removeByIdx(idx);
        this.trigger('removed');
        this.card.trigger('updated');
        this.card.invalidateFullInfo();

        this.AppEventsService.track('removed-card-grouping');

        return this.card.metrics.loadData().then(() => grouping);
    }

    removeGroupings(groupings, loadCardData = true) {
        groupings.forEach(item => {
            this.removeItem(item);
        });
        this.trigger('removed');
        this.card.trigger('updated');
        this.card.invalidateFullInfo();
        return loadCardData ? this.card.metrics.loadData().then(() => groupings) : this.$q.when(true);
    }

    getAvailable() {
        var params = {
            card: this.card.getJson()
        };

        let req = this.$q.all([this.DataProvider.post('card/availableGroupings', params, false), this.MetricDataService.loadOrganisationTables(true)]);

        return req.then(results => {
            let groupingsResponse = results[0], tables = results[1];
            let groupings = [];

            groupingsResponse.forEach((value) => {
                groupings.push(new this.ColumnEntityModel(value));
            });

            ColumnHelper.assignTablesToColumns(groupings, tables);

            return groupings;
        });
    }

    getJson() {
        return this.map(group => new CardGrouping(group).getJson());
    }

    getState() {
        return {
            items: this.items.map(group => _.clone(group))
        };
    }

    setState(state) {
        this.items = state.items;
    }
}

truedashApp.factory('CardGroupingsFactory', (DataProvider, $q, ColumnEntityModel, MetricDataService, AppEventsService) => ({
    create: (card) => new CardGroupings(card, DataProvider, $q, ColumnEntityModel, MetricDataService, AppEventsService)
}));
