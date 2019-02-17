'use strict';

import {Collection} from '../../data/collection.js';
import {Helpers} from '../../common/helpers';

class CardFormulas extends Collection {
    constructor(card, FormulaFactory, DataProvider) {
        super();
        /** @type {Card} */
        this.card = card;
        this.FormulaFactory = FormulaFactory;
        this.DataProvider = DataProvider;

        this._virtualIdMap = {};
    }

    init(cardData) {
        this.convertFormulasData(angular.copy(cardData.formulas) || []);
    }

    convertFormulasData(formulasList) {
        this.clear();
        formulasList.forEach(formula => {
            this.addItem(this.FormulaFactory.create(formula));
        });
    }

    invalidate() {
        this.card.invalidateFullInfo();
        this.card.trigger('updated', this.card);
    }

    add(formula) {
        formula = this.FormulaFactory.clone(formula);
        if (this.card.isVirtual()) {
            formula.data.virtualId = this.card.nextVirtualId();
        }

        this.addItem(formula);
        this.card.metrics.addFormula(formula);
        this.card.trigger('updated');
        this.trigger('added');
        
        return this.card.metrics.loadData().then(() => formula);
    }

    remove(index) {
        var formula = this.removeByIdx(index);
        this.card.metrics.removeFormula(formula);
        this.trigger('removed');
        this.card.trigger('updated');

        return this.card.metrics.loadData().then(() => formula);
    }

    update(idx, newFormula) {
        var formula = this.get(idx);
        newFormula.data.color = newFormula.color;
        formula.update(newFormula.data);
        var formulaDataset = this.card.metrics.find(m => m.isFormula() && m.virtualId === formula.data.virtualId);
        formulaDataset.color = formula.data.color;
        formulaDataset.info.type = formula.data.type;
        formulaDataset.setName(formula.data.name);
        formulaDataset.isIncrease = formula.data.isIncrease;
        formulaDataset.isColoring = formula.data.isColoring;
        formulaDataset.resetColumns();
        this.trigger('updated');
        this.card.trigger('updated');

        return this.card.metrics.loadData().then(() => formula);
    }

    getLetters() {
        let letters = this.card.metrics
            .filter(metric => !metric.isFormula())
            .reduce((res, metric) => this.metricLettersReduceFunction(res, metric), []);
    
        // Sort letters by length and alphabet
        letters.sort((a, b) => a[0].length - b[0].length || a[0].localeCompare(b[0]));
        
        return letters;
    }

    metricLettersReduceFunction(res, metric) {
        let metrics = this.card.metrics;
        let letters = metrics.map(metric => metric.letter);
        let letter =  metric.letter || this.getFreeLetter(letters);
        if (!metric.letter) {
            metric.letter = letter;
        }
        let virtualId = metric.virtualId;

        if (!virtualId && metrics._virtualIdMap && metric.id) {
            virtualId = metrics._virtualIdMap[metric.id];
        }

        res.push([letter, metric.name, virtualId]);

        return res;
    }

    /**
     * @private
     * @param {String[]} list
     */
    getFreeLetter(list){
        let firstSetOfLetters = ['', ...Helpers.alphabet];
        
        for(let i = 0; i < firstSetOfLetters.length; i++) {
            for(let j = 0; j < Helpers.alphabet.length; j++) {
                let calculatedLetter = firstSetOfLetters[i] + Helpers.alphabet[j];
                let exists = list.find(currentLetter => currentLetter === calculatedLetter);
                
                if(!exists) return calculatedLetter;
            }
        }
    }

    getLettersJson() {
        var res = {};
        this.getLetters().forEach(([letter, name, virtualId], index) => {
            if (virtualId) {
                res[virtualId] = letter;
            } else {
                let position = index + 1;
                res[position] = letter;
            }

        });
        return res;
    }

    removeByDataSet(dataset) {
        var toRemove = new Set();
        this.slice().forEach((formula) => {
            for (var id in formula.data.metrics) {
                if (id == dataset.virtualId) {
                    toRemove.add(formula);
                }
            }
        });

        for (var formula of toRemove) {
            this.removeItem(formula);
            this.card.metrics.removeFormula(formula);
        }

        //todo: update letters in all formulas to be nice
    }

    getJson() {
        return this.map(formula => {
            return {
                virtualId: formula.data.virtualId,
                type: formula.data.type,
                expression: formula.data.expression,
                name: formula.data.name,
                metrics: formula.data.metrics,
                color: formula.color,
                isIncrease: formula.data.isIncrease,
                isColoring: formula.data.isColoring
            };
        });
    }

    isCalculatedOnCompares(formulaId) {
        let formula = this.getByVirtualId(formulaId);
        
        if (!formula) return false;
        
        let ids = Object.keys(formula.data.metrics);
        return ids.some(id => this.card.metrics.getDataSetById(parseInt(id)).isComparable());
    }

    /**
     * @param id
     * @returns {Formula}
     */
    getByVirtualId(id) {
        return this.find(formula => formula.data.virtualId == id);
    }


    /**
     * @param id
     * @returns {Formula}
     */
    getById(id) {
        return this.find(formula => formula.data.id == id);
    }

    getState() {
        return {
            items: this.map(formula => this.FormulaFactory.clone(formula))
        };
    }

    setState(state) {
        this.items = state.items;
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
}

truedashApp.factory('CardFormulasFactory', (FormulaFactory, DataProvider) => ({
    create: (card) => new CardFormulas(card, FormulaFactory, DataProvider)
}));
