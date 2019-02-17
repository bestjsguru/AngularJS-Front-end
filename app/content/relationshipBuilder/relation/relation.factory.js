"use strict";

import RelationModel from './relation.model';

truedashApp.service('RelationFactory', () => ({
    create: (data) => new RelationModel(data)
}));
