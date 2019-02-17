'use strict';

import {EventEmitter} from '../system/events.js';

/**
 * Collection of arbitrary items. It tries to keep interface close to Array,
 * but collection[idx] syntax is implemented as collection.get(idx) and collection.set(idx, value)
 */
export class Collection extends EventEmitter {
    constructor() {
        super();
        this.items = [];
        Object.defineProperty(this, 'length', {
            get: () => this.items.length
        });
    }

    clear() {
        this.forEach(item => this.unbindItem(item));
        this.items.length = 0;
    }

    //convenience array-like functions

    forEach(fn) { return this.items.forEach(fn); }

    map(fn) { return this.items.map(fn); }

    reduce(...args) { return this.items.reduce(...args); }

    sort(fn) { return this.items.sort(fn); }

    filter(fn) { return this.items.filter(fn); }

    find(fn) { return this.items.find(fn); }
    
    first() { return this.get(0); }
    
    //use for shallow clone
    slice(...args) { return this.items.slice(...args); }

    get(idx) { return this.items[idx]; }

    getById(id) { return this.items.find(item => item.id == id); }

    set(idx, value) { this.items[idx] = value; }

    addItem(item) {
        this.items.push(item);
        this.bindItem(item);
        this.trigger('itemAdded', item);
        return item;
    }

    removeItem(item) {
        var idx = this.items.indexOf(item);
        return this.removeByIdx(idx);
    }

    removeByIdx(idx) {
        if (idx < 0 || idx >= this.items.length) return null;

        var item = this.items.splice(idx, 1)[0];
        this.unbindItem(item);
        this.trigger('itemRemoved', item);
        return item;
    }

    /**
     * used to be overridden in subclasses to bind events for an item then it is created
     * @param item
     */
    bindItem(item) {
        //no code here, it is ok
    }

    /**
     * used to be overridden in subclasses to unbind events for an item then it is created
     * @param item
     */
    unbindItem(item) {
        //no code here, it is ok
    }

    isEmpty() {
        return this.items.length === 0;
    }
}
