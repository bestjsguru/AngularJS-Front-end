"use strict";

import AnomalyModel from './anomaly.model';

truedashApp.service('AnomalyFactory', ($injector) => ({
    create: (data) => new AnomalyModel(data, $injector)
}));
