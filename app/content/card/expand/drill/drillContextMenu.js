'use strict';

export default class DrillContextMenu {
    constructor(menuClass) {
        this.isVisible = false;
        this.menuClass = menuClass;
    }
    
    fitToScreen() {
        let position = _.cloneDeep(this.position);
        
        this.watchers.timeout(() => {
            
            // If position.top is equal to zero that means its a manual position from the dropdown menu and we will not alter the value
            if(!position.isFixed) {
                // This is to compensate padding that was added to .drill-card element
                position.left = position.left + 20;
                position.top = position.top + 20;
    
                let dropdownWidth = this.$element.find(this.menuClass).first().outerWidth();
                let dropdownHeight = this.$element.find(this.menuClass).first().outerHeight();
    
                let parent = this.$element.parents('.drill-wrapper').first();
                let rightSideSpace = (document.documentElement.clientWidth - parent.width()) / 2;
                let bottomSideSpace = document.documentElement.clientHeight - parent.height() - 120;
    
                let canFitDown = position.top + dropdownHeight < (parent.height() + bottomSideSpace);
                let canFitRight = position.left + dropdownWidth < (parent.width() + rightSideSpace);
    
                this.$element.find(this.menuClass).first().css({
                    top: canFitDown ? position.top : position.top - dropdownHeight,
                    left: canFitRight ? position.left : position.left - dropdownWidth,
                    display: 'block',
                });
            } else {
                this.$element.find(this.menuClass).first().css({
                    top: _.isNumber(position.top) ? position.top : 'auto',
                    right: _.isNumber(position.right) ? position.right : 'auto',
                    bottom: _.isNumber(position.bottom) ? position.bottom : 'auto',
                    left: _.isNumber(position.left) ? position.left : 'auto',
                    display: 'block',
                });
            }
        });
    }
    
    closeOnClick() {
        // Hide menu when clicked on any dropdown on page because
        // dropdowns will prevent regular click event from happening
        this.$document.on('show.bs.dropdown', () => {
            this.isVisible && this.hide();
        });
        
        // Hide menu when clicked outside of it anywhere on page
        this.$document.bind('mousedown', (event) => {
            if(!this.isVisible) return;
            
            let clickedOutside = this.$element.find(this.menuClass).first().find(event.target).length === 0;
            
            clickedOutside && this.hide();
        });
    }
    
    show() {
        this.watchers.timeout(() => {
            this.isVisible = true;
        });
    }
    
    hide() {
        this.$element.find(this.menuClass).first().css({
            display: 'none',
        });
        
        this.watchers.timeout(() => {
            this.isVisible = false;
        });
    }
}
