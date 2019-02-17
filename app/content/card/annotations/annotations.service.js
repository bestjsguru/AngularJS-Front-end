'use strict';

import './annotations.factory';

class AnnotationsService {
    constructor(DataProvider, $q, AnnotationsFactory) {
        this.$q = $q;
        this.DataProvider = DataProvider;
        this.AnnotationsFactory = AnnotationsFactory;
    }
    
    create(item) {
        return this.DataProvider.post('card/addAnnotation', item.getJson());
    }
    
    update(item) {
        return this.DataProvider.post('card/editAnnotation/' + item.id, {
            title: item.title
        });
    }
    
    getForCard(cardId, useCache = true) {
        return this.DataProvider.get('card/annotationList/' + cardId, {}, useCache);
    }

    remove(annotationId) {
        return this.DataProvider.get('card/deleteAnnotation/' + annotationId);
    }
}

truedashApp.service('AnnotationsService', AnnotationsService);
