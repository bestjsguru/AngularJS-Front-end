'use strict';

class Tabs {
    constructor(availableTabs = []) {
        this.availableTabs = availableTabs;

        if(!this.availableTabs.length) throw new Error('Tabs constructor requires array of available options');

        this.selected = this.availableTabs[0];
    }

    activate(option) {
        // If we don't pass anything we will select default tab
        if(!option) this.selected = this.availableTabs[0];

        if(this.availableTabs.includes(option)) this.selected = option;
    }

    is(option) {
        return this.selected === option;
    }
}

export default Tabs;
