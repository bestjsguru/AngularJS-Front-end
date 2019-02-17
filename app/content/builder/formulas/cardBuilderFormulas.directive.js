'use strict';

import './formula.model';
import './validMathExpression.directive';

import ColorPickerConfig from '../../common/colorPicker/colorPickerConfig';
import {Config} from '../../config.js';

class CardBuilderFormulasController {
    constructor($scope, toaster, $q, FormulaFactory, DeregisterService, AppEventsService) {

        this.ColorPickerConfig = new ColorPickerConfig();
        this.AppEventsService = AppEventsService;
        this.FormulaFactory = FormulaFactory;
        this.toaster = toaster;
        this.$scope = $scope;
        this.$q = $q;

        this.watchers = DeregisterService.create($scope);
        this.formulaTypes = Config.formula.types;
        this.showLoader = false;
        this.checkDelete = [];
        this.formulas = [];
        this.deleting = [];
        this.forms = {};
    }

    $onInit() {
        this.card = this.cardBuilder.card;
        this.card.metrics.on('added removed clear loaded', () => this.refreshFormulaLetters());
        this.card.formulas.on('added removed updated', this.onFormulasChanged, this);

        this.refreshFormulaLetters();
    }

    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.formulas.off(null, null, this);
    }

    onFormulasChanged() {
        this.initFormulas();
    }

    changeFormulaType(formula, type) {
        formula.setType(type.value);
    }

    isLoading() {
        return this.cardBuilder.loading;
    }

    refreshFormulaLetters() {
        this.letters = this.card.formulas.getLetters();
        this.initFormulas();
    }

    initFormulas() {
        // we will preserve all unsaved formulas and add them back to the end of the list
        let unsavedFormulas = this.formulas.filter(formula => !formula.added);

        this.formulas = [];
        this.checkDelete = [];
        this.deleting = [];
        if (this.card.formulas.length) {
            this.card.formulas.forEach(value => {
                this.addNewFormula(value);
            });
        }

        this.formulas = [...this.formulas, ...unsavedFormulas];
    }

    getUsedMetrics(expression) {
        let metrics = {};
        
        // Get letters in reverse order so longest letters comes first
        let letters = this.letters.slice();
        letters.reverse();
        
        letters.forEach(function ([letter, metric, id]) {
            if (expression.includes(letter)) {
                metrics[id] = letter;
                
                // Remove letter from expression
                expression = expression.replaceAll(letter, '');
            }
        });
        
        return metrics;
    }

    deleteFormula(index) {
        if (this.formulas[index].added) {
            this.card.columnSorting.sortOrder = [];
            this.deleting[index] = true;
            this.card.formulas.remove(index);
    
            this.AppEventsService.track('deleted-card-formula');
        } else {
            this.formulas.splice(index, 1);
            this.checkDelete[index] = false;
        }
    }

    focusFormula(formula) {
        this.formulas.map(item => item.focused = false);
        formula.focused = true;
    }

    addFormulaInput(item) {
        // Find currently focused formula, or default to last one in case of problems
        var formula = this.formulas.find(formula => formula.focused);
        if(!formula) formula = this.formulas.slice(-1).pop();

        if(!formula) return;

        formula.setExpression((formula.getExpression().concat(' ').concat(item)).trim());
    }

    addNewFormula(formula) {
        formula = formula ? this.FormulaFactory.clone(formula) : this.FormulaFactory.create({
            id: null,
            expression: '',
            isIncrease: true,
            isColoring: false
        });

        if(formula.hasId()) formula.added = true;

        // Set default type
        if (!formula.getType()) formula.setType(this.formulaTypes[0].value);

        this.formulas.push(formula);
        this.focusFormula(formula);
    }

    removeColor(formula) {
        formula.color = null;
    }

    applyFormula(index) {
        var formName = 'formula_' + index + '_form';
        var formula = this.formulas[index];

        if (this.forms[formName].$invalid) {
            this.toaster.warning('Your formula is not valid.');
            return;
        }

        formula.added = true;

        // This is used to convert expression string to UPPERCASE
        formula.setExpression(formula.getExpression());
        formula.setMetrics(this.getUsedMetrics(formula.getExpression()));

        if (!formula.hasId()) {
            this.card.columnSorting.sortOrder = [];
            this.card.formulas.add(formula);
    
            this.AppEventsService.track('created-card-formula');
        } else {
            this.card.formulas.update(index, formula);
    
            this.AppEventsService.track('updated-card-formula');
        }
    }

    showNoFormulas() {
        return !this.showLoader && this.card.metrics.length && !this.formulas.length;
    }

    showFormulasList() {
        return !this.showLoader && this.card.metrics.length && this.formulas.length;
    }
}

truedashApp.component('appCardBuilderFormulas', {
    controller: CardBuilderFormulasController,
    templateUrl: 'content/builder/formulas/cardBuilderFormulas.html',
    require: {
        cardBuilder: '^appBuilder'
    }
});
