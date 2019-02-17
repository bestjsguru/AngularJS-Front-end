'use strict';

import {AnnotationsCollection} from './annotations.collection';

class Annotations extends AnnotationsCollection {
    constructor(data, $injector) {
        super($injector);

        data = data || [];
        
        this.data = data;
        this.init(data);
    }

    init(annotations) {
        this.clear();
    
        // Filter out invalid annotations. They must have either valid X or valid Category parameters
        annotations = annotations.filter(item => item.x || item.category);
        
        annotations.forEach(item => this.add(item));

        this.sortAnnotations();
        
        return this.items;
    }
}

truedashApp.service('AnnotationsFactory', ($injector) => ({
    create: (data) => {
        return new Annotations(data, $injector);
    }
}));
