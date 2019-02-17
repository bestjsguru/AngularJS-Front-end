'use strict';

import {AnnotationModel} from './annotation.model';
import {Collection} from '../../data/collection';

export class AnnotationsCollection extends Collection {
    constructor($injector) {
        super();
        this.$injector = $injector;
    }

    static create(data, $injector) {
        return new AnnotationModel(data, $injector);
    }

    add(data) {
        let item = AnnotationsCollection.create(data, this.$injector);
        this.items.push(item);
        this.trigger('added', item);
        return item;
    }
    
    toggle(annotation = {}) {
        this.items.forEach(item => {
            item.selected = item.isSameAs(annotation) ? !item.selected : false;
        });
    }

    sortAnnotations() {
        // Sort annotations by date range point and creation date
        this.items.sort((a, b) => {
            if(a.x - b.x === 0) return a.date - b.date;
            return a.x - b.x;
        });
    }

    remove(annotation) {
        if(annotation.isNew()) {
            this.removeItem(annotation);
            this.trigger('removed', annotation);
        } else {
            let index = this.items.findIndex((item) => item.id === annotation.id);
    
            if(index >= 0) {
                this.removeByIdx(index);
                this.trigger('removed', annotation);
            }
        }
    }

    clear() {
        super.clear();
        this.trigger('clear');
    }
}
