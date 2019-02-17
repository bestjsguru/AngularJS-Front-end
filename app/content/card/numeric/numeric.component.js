'use strict';

import {Helpers} from '../../common/helpers';

class NumericCtrl {
    constructor($filter, Auth) {
        this.Auth = Auth;
        this.$filter = $filter;
    }
    
    $onInit() {
        this.card.metrics.on('added removed loaded updated', () => {
            if(this.getMetric()) {
                this.setValue();
                this.applyFormatting();
            }
        }, this);
        
        if(!this.card.isVirtual()) {
            this.card.metrics.getLoadPromise().then(() => {
                this.setValue();
                this.applyFormatting();
            });
        } else {
            this.setValue();
            this.applyFormatting();
        }
    
        this.card.formatting.on('updated', () => {
            this.applyFormatting();
        }, this);
    }
    
    get goal() {
        return this.getFormattedValue(this.card.goal);
    }
    
    get isIncrease() {
        return this.metric && this.metric.isIncrease;
    }
    
    progressClass() {
        if(this.isIncrease && this.getValue() >= this.card.goal) return 'success';
        if(!this.isIncrease && this.getValue() <= this.card.goal) return 'success';
        
        return 'danger';
    }
    
    progressSentence() {
        let value = this.getFormattedValue(this.card.goal - this.getValue());
    
        if(this.getValue() === this.card.goal) {
            return `Goal achieved`;
        }
    
        if(!this.isIncrease && this.getValue() < this.card.goal) {
            return `${value} above goal`;
        }
        
        if(this.isIncrease && this.getValue() > this.card.goal) {
            value = this.getFormattedValue(this.getValue() - this.card.goal);
            return `${value} above goal`;
        }
        
        if(this.getValue() > this.card.goal) {
            value = this.getFormattedValue(this.getValue() - this.card.goal);
        }
        
        return `${value} to goal`;
    }
    
    get loading() {
        if(this.cardComponent) return this.card.metricsAreLoading();
        if(this.exploreComponent) return this.exploreComponent.isLoading();

        return !this.card.metrics.loaded;
    }
    
    setValue() {
        this.metric = this.getMetric();
        this.originalValue = this.getFormattedValue(this.getValue());
        this.value = _.clone(this.originalValue);
        
        this.formattingOptions = {
            results: [0, this.originalValue],
            columns: ['Date', this.metric.label],
            columnIndex: 1,
            rowIndex: 0,
        };
    }
    
    applyFormatting() {
        let formatting = this.card.formatting.check(
            this.originalValue,
            this.formattingOptions.columns,
            this.formattingOptions.results,
            this.formattingOptions.columnIndex,
            this.formattingOptions.rowIndex
        );
    
        this.value = _.clone(this.originalValue);
        
        if(!formatting) return;
    
        if(this.card.metrics.columnIsNumeric(this.formattingOptions.columnIndex)) {
            let number = Helpers.toNumberWithPrefixAndSuffix(this.originalValue);
    
            if(!_.isNull(number.value) && !_.isNaN(number.value)) {
                this.value = number.value;
                this.value = this.$filter('value')(
                    this.value,
                    null,
                    formatting.useShortNumbers,
                    false,
                    formatting.decimals,
                    formatting.commaSeparator
                );
        
                this.value = [number.prefix, this.value, number.suffix].join('');
            }
        }
    
        if(formatting.prefix) {
            let position = this.value.indexOf('-') + 1;
        
            this.value = [this.value.slice(0, position), formatting.prefix, this.value.slice(position)].join('');
        }
    
        if(formatting.suffix) {
            this.value += formatting.suffix;
        }
    }
    
    getMetric() {
        // Get first visible metric
        return this.card.metrics.find(metric => !metric.isHidden());
    }
    
    getValue() {
        if(!this.card.metrics.loaded) return '';
        
        let value = 0;
        if(this.metric) {
            this.metric.getData().forEach(val => value += val[1]);
    
            value = Helpers.round(value, this.metric.numberOfDecimals);
        }
        
        return value;
    }
    
    getFormattedValue(value) {
        if(this.metric) {
            let formatting = this.metric.getFormattingInfo();
            
            let params = {
                symbol: formatting.symbol,
                type: formatting.type
            };
            
            return value !== 0 ? this.$filter('value')(value, params, false, false, this.metric.numberOfDecimals) : 0;
        }
        
        return value;
    }
    
    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.formatting.off(null, null, this);
    }
}

truedashApp.component('tuNumeric', {
    controller: NumericCtrl,
    templateUrl: 'content/card/numeric/numeric.html',
    bindings: {
        card: '='
    },
    require: {
        cardComponent: '^?tuCard',
        exploreComponent: '^?tuExplore'
    }
});
