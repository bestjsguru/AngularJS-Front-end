'use strict';

import {EventEmitter} from '../../system/events.js';
import {DrillPresetModel} from '../expand/drill/presets/drillPreset.model';

import '../expand/drill/presets/drillPresets.service';

class CardDrillPresets extends EventEmitter {
    constructor(card, DataProvider, $q, toaster, DrillPresetsService) {
        super();
        this.$q = $q;
        /** @type {Card} */
        this.card = card;
        this.toaster = toaster;
        this.DataProvider = DataProvider;
        this.DrillPresetsService = DrillPresetsService;
    
        this.items = [];
        this.active = null;
    }

    load(useCache = true) {
        this.items = [];
        this.loading = true;
        
        return this.DrillPresetsService.getAll(this.card.id, useCache).then(presets => {
            this.items = presets.map(item => new DrillPresetModel(item));
        }).finally(() => {
            this.loading = false;
        });
    }
    
    select(preset, params) {
        if(this.card.drill.isActive()) {
            this.card.drill.trigger('reset', preset);
        
            return;
        }
    
        this.activate(preset);
    
        // Drill by first column found in the path that is not already used on a card
        preset.columns.some(column => {
            // Do nothing if card is already grouped by this column
            if(this.card.drill.columnPosition(column)) return;
        
            this.card.drill.trigger('presetDrill', params, column);
        
            return true;
        });
    }
    
    nextColumn() {
        if(!this.active) return null;

        return _.get(this.active.columns, `[${this.card.groupings.length}]`, null);
    }
    
    futureColumns() {
        if(!this.active) return null;

        return this.active.columns.slice(this.card.groupings.length);
    }
    
    save(preset) {
        preset.error = false;
        preset.loading = true;
    
        return this.DrillPresetsService.save(preset).then(() => {
            preset.saveMode = false;
            
            this.invalidate();
        }).catch((error) => {
            preset.error = true;
            preset.message = error.message;
        }).finally(() => {
            preset.loading = false;
        });
    }
    
    remove(preset) {
        preset.loading = true;
        
        return this.DrillPresetsService.remove(preset).then(() => {
            this.items = this.items.filter(item => item.id !== preset.id);
            
            this.invalidate();
        }).finally(() => {
            preset.loading = false;
        });
    }
    
    activateWithLastLevel(preset) {
        this.active = preset;
    }
    
    activate(preset) {
        this.active = preset;
    }
    
    deactivate() {
        this.active = null;
    }
    
    invalidate() {
        this.DataProvider.clearUrlCache('card/getPresets/' + this.card.id, 'GET');
    }
}

truedashApp.service('CardDrillPresetsFactory', (DataProvider, $q, toaster, DrillPresetsService) => ({
    create: (card) => { return new CardDrillPresets(card, DataProvider, $q, toaster, DrillPresetsService)}
}));
