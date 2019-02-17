'use strict';

import DriverModel from './driver.model';
import {EventEmitter} from "../../system/events";
import {Helpers} from '../../common/helpers';

export default class RelationModel extends EventEmitter {
    constructor(data) {
        super();

        data = data || {};
        this.Auth = window.$injector.get('Auth');
        this.sunWeek = this.Auth.user.organisation.sunWeek ? 1 : 0;

        this.id = data.id || null;
        this.name = data.name || 'New relationship';
        this.formula = data.equation || '';
        this.goal = null;
        this.drivers = [];
        this.current = data.current || this.getCurrentDateDefault();
        this.previous = data.previous || this.getPreviousDateDefault();

        if(data.goal_metric) this.goal = new DriverModel(data.goal_metric);

        data.driver_metrics && data.driver_metrics.forEach(driver => {
            this.drivers.push(new DriverModel(driver));
        });

        this.resetDriverLetters();
    }

    get letters() {
        return this.drivers.reduce((letters, driver) => {
            letters.push(driver.letter);
            return letters;
        }, []);
    }

    selectGoal(data) {
        this.goal = new DriverModel(data);
        this.trigger('goal.added', this.goal);
    }

    getCurrentDateDefault() {
        return {
            fromDate: moment().add(this.sunWeek, 'd').startOf('isoWeek').subtract(this.sunWeek, 'd'),
            toDate: moment().add(this.sunWeek, 'd').endOf('isoWeek').subtract(this.sunWeek, 'd'),
            rangeName: 'week'
        };
    }

    getPreviousDateDefault() {
        return {
            fromDate: moment().add(this.sunWeek, 'd').startOf('isoWeek').subtract(this.sunWeek + 7, 'd'),
            toDate: moment().add(this.sunWeek, 'd').endOf('isoWeek').subtract(this.sunWeek + 7, 'd'),
            rangeName: 'prevWeek'
        };
    }

    setContribution(data) {
        data.forEach((item) => {
            let driver = this.drivers.find(driver => driver.metric_id === item.id);

            if(driver) driver.setContribution(item.contribution);
        });
    }

    resetDriverLetters() {
        this.drivers = this.drivers.map((driver, index) => {
            // When drivers are reordered we need to preserve formula so
            // we replace letters by ids in order to return them latter
            if(driver.letter && driver.letter != Helpers.alphabet[index]) {
                this.formula = this.formula.replaceAll(driver.letter, 'driver_letter_' + driver.metric_id);
            }
            driver.letter = Helpers.alphabet[index];
            return driver;
        });

        // Convert driver ids to formula letters
        this.drivers.forEach((driver) => {
            this.formula = this.formula.replaceAll('driver_letter_' + driver.metric_id, driver.letter);
        });
    }

    hasDriverMetric(metricId) {
        return this.drivers.find(item => item.metric_id === metricId);
    }

    toggleMetric(metric) {
        this.toggleDriver(new DriverModel({
            metric_id: metric.id,
            name: metric.label
        }));
    }

    toggleDriver(driver) {
        this.hasDriverMetric(driver.metric_id) ? this.removeDriver(driver) : this.addDriver(driver);
    }

    addDriver(driver) {
        this.drivers.push(driver);
        this.resetDriverLetters();
        this.trigger('driver.added', driver);
    }

    removeDriver(driver) {
        this.drivers = this.drivers.filter(item => item.metric_id !== driver.metric_id);
        this.resetDriverLetters();
        this.trigger('driver.removed', driver);
    }

    getJson() {
        let data = {
            name: this.name,
            driver_metrics: this.drivers.map(driver => {
                return {
                    metric_id: driver.metric_id,
                    name: driver.name,
                    equation_symbol: driver.letter
                };
            }),
            equation: this.formula,
            previous: {
                fromDate: +this.previous.fromDate,
                toDate: +this.previous.toDate,
                rangeName: this.previous.rangeName
            },
            current: {
                fromDate: +this.current.fromDate,
                toDate: +this.current.toDate,
                rangeName: this.current.rangeName
            }
        };

        if(this.goal) data.goal_metric = {
            metric_id: this.goal.metric_id,
            name: this.goal.name
        };

        if(this.id) data.id = this.id;

        return data;
    }
}
