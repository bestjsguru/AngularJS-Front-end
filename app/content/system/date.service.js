'use strict';

import {Config} from '../config';

class DateService {
    
    constructor(OrganisationService) {
        this.OrganisationService = OrganisationService;
    }

    getDateRanges() {
        return this.OrganisationService.load().then((organisation) => {
            let res = angular.copy(Config.dateRanges);
            if (organisation.fiscalYearStart == null) {
                let ranges = res.find(group => group.label === 'Current').ranges;
                ranges.splice(ranges.findIndex(range => range.value === 'fiscalYear'), 1);
                ranges = res.find(group => group.label === 'Previous').ranges;
                ranges.splice(ranges.findIndex(range => range.value === 'prevFiscalYear'), 1);
            }
            return res;
        });
    }
}

truedashApp.service('DateService', DateService);
