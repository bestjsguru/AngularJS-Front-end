'use strict';

class RootCauseDigestCtrl {

    constructor(DeregisterService, $scope, $document, $element, $filter) {
        this.watchers = DeregisterService.create($scope);
        this.$document = $document;
        this.$element = $element;
        this.$filter = $filter;

        this.isVisible = false;
        
        this.combinationsCollapsed = true;
        this.topReasonsCollapsed = true;
    }
    
    $onInit() {
        this.closeOnClick();
        this.initGoalImpacts();
    }
    
    closeOnClick() {
        // Hide menu when clicked on any dropdown on page because
        // dropdowns will prevent regular click event from happening
        this.$document.on('show.bs.dropdown', () => {
            this.isVisible && this.hide();
        });
        
        // Hide menu when clicked outside of it anywhere on page
        this.$document.bind('click', (event) => {
            if(!this.isVisible) return;
        
            let clickedOutside = this.$element.find(event.target).length === 0;
        
            clickedOutside && this.hide();
        });
    }
    
    toggle() {
        this.isVisible ? this.hide() : this.show();
    }
    
    hide() {
        this.$element.find('.root-cause-digest').removeClass('open');
        
        this.watchers.timeout(() => {
            this.isVisible = false;
        });
    }
    
    show() {
        this.isVisible = true;
        
        this.watchers.timeout(() => {
            this.$element.find('.root-cause-digest').addClass('open');
        });
    }
    
    impactString(impact) {
        let direction = impact.value.impact > 0 ? 'up' : 'down';
        let change = impact.formatNumber(Math.abs(impact.value.impact));
        
        return `${direction} by ${change}`;
    }
    
    initGoalImpacts() {
        let impacts = this.impacts.goal.drillDown.diff.reduce((impacts, value, index) => {
            let impact = {
                value: value,
                formattedValue: this.$filter('value')(value, {symbol: this.impacts.goal.symbol}, true, true),
                isIncrease: this.impacts.goal.isIncrease,
                isGood: value > 0 && this.impacts.goal.isIncrease || value <= 0 && !this.impacts.goal.isIncrease,
                dimensions: [],
            };
    
            this.impacts.goal.drillDown.dimensions.forEach(dimension => {
                impact.dimensions.push({
                    name: dimension.name,
                    value: dimension.values[index],
                });
            });
            
            return [...impacts, impact];
        }, []);
        
        if(this.impacts.goal.value.impact > 0) {
            // Show biggest increase first
            impacts.sort((a, b) => b.value - a.value);
        } else {
            // Show biggest decrease first
            impacts.sort((a, b) => a.value - b.value);
        }
        
        this.goalImpacts = impacts.slice(0, 3);
    }
    
    toggleTopReasons() {
        this.topReasonsCollapsed = !this.topReasonsCollapsed;
    }
    
    toggleCombinations() {
        this.combinationsCollapsed = !this.combinationsCollapsed;
    }
}

truedashApp.component('appRootCauseDigest', {
    controller: RootCauseDigestCtrl,
    templateUrl: 'content/rootCause/digest/rootCauseDigest.html',
    bindings: {
        impacts: '<',
        topReasons: '<',
        rootCause: '<',
    }
});
