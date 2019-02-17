'use strict';

class Formula {
    constructor(data) {
        this.data = {};
        this.setData(data);
    }

    setData(data) {
        this.data = angular.extend(this.data, data);
        this.color = data.color || null;
    }

    getId() {
        return this.data.id;
    }

    hasId() {
        return (this.data.id || this.data.virtualId);
    }

    getExpression() {
        return this.toUpperCase(this.data.expression);
    }

    setExpression(expression) {
        this.data.expression = this.toUpperCase(expression);
    }

    getType() {
        return this.data.type;
    }

    setType(type) {
        this.data.type = type;
    }

    getMetrics() {
        return this.data.metrics;
    }

    setMetrics(metrics) {
        this.data.metrics = metrics;
    }

    update(data) {
        this.setData(data);
    }

    toUpperCase(value) {
        var isString = typeof value === 'string';
        return isString ? value.toUpperCase() : '';
    }
}

function FormulaFactory() {
    return {
        create: (data) => new Formula(data),
        clone: (formula) => {
            var data = formula.data;
            data.color = formula.color;
            return new Formula(data);
        }
    };
}

truedashApp.factory('FormulaFactory', FormulaFactory);
