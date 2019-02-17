"use strict";

import ApiaiModel from './apiai.model';

truedashApp.service('ApiaiFactory', ($injector) => ({
    create: (data) => new ApiaiModel(data, $injector)
}));
