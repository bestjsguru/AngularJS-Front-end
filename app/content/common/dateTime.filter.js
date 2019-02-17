'use strict';

import {Config} from '../config.js';

truedashApp
    .filter('dateRegular', function formatFilter() {
        return function (value) {
            return moment(value).format(Config.dateFormats.regular);
        };
    })
    .filter('dateFull', function formatFilter() {
        return function (value) {
            return moment(value).format(Config.dateFormats.full);
        };
    })
    .filter('dateGrails', function formatFilter() {
        return function (value) {
            return moment(value).format(Config.dateFormats.grails);
        };
    })
    .filter('timeRegular', function formatFilter() {
        return function (value) {
            return moment(value).format(Config.timeFormats.regular);
        };
    });
