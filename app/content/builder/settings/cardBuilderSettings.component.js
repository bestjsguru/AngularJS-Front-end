'use strict';

import './general/cardBuilderGeneral.component';
import './options/cardBuilderOptions.component';
import './style/cardBuilderStyle.component';
import './image/cardBuilderImage.component';
import '../compares/cardBuilderCompares.component';
import '../drill/cardBuilderDrill.component';
import '../formulas/cardBuilderFormulas.directive';
import '../formatting/formatting.component';
import '../formatting/regular/regularFormatting.component';

import Tabs from '../../common/tabs';

class CardBuilderSettingsCtrl {
    constructor($scope, DeregisterService, $stateParams, $state) {
        this.$state = $state;
        this.$stateParams = $stateParams;
        this.DeregisterService = DeregisterService;

        this.tabs = new Tabs(['general', 'options', 'style', 'image', 'formulas', 'compares', 'formatting']);
        this.tabs.activate(this.$stateParams.tab);

        this.watchers = this.DeregisterService.create($scope);

    }

    setTab(tab) {
        this.tabs.activate(tab);
        this.$state.go('.', {tab: tab}, {notify: false});
    }

    $onInit() {
        this.card = this.cardBuilder.card;
        this.card.metrics.on('added removed clear loaded', this.validateActiveTab, this);

        this.validateActiveTab();
    }

    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }
    
    formattingTabIsVisible() {
        return this.card.types.get() === 'table' || this.isNumericAsTable() || this.isNumeric();
    }
    
    isNumericAsTable() {
        return this.isNumeric() && this.card.metrics.getVisibleCount() > 1;
    }
    
    isNumeric() {
        return this.card.types.get() === 'numeric';
    }

    validateActiveTab() {
        let requiresSelectedMetric = ['formulas', 'compares', 'drill', 'formatting'];
        if(!this.card.metrics.length && requiresSelectedMetric.includes(this.tabs.selected)) {
            this.setTab();
        }
        
        let requiresTableType = ['formatting'];
        if(!this.formattingTabIsVisible() && requiresTableType.includes(this.tabs.selected)) {
            this.setTab();
        }
    }
}

truedashApp.component('appCardBuilderSettings', {
    require: {
        cardBuilder: '^appBuilder'
    },
    controller: CardBuilderSettingsCtrl,
    templateUrl: 'content/builder/settings/cardBuilderSettings.html'
});
