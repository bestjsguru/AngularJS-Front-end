'use strict';

let MobileDetect = require('mobile-detect');
let md = new MobileDetect(window.navigator.userAgent);

var hostName = window.location.hostname;

var securedDomains = ['app.avora.com', 'uat.avora.com', 'dev.avora.com', 'local.avora.com'];
var productionDomains = ['app.avora.com'];
var localDomains = ['local.avora.com'];

//this revision number will be replaced with current commit hash via gulp task
let currentServer = '###CURRENT_SERVER###';
const revisionNumber = '###REV_NUMBER###';
const versionNumber = '###APP_VERSION###';

const isDev = productionDomains.indexOf(hostName) === -1;
const isLocal = localDomains.indexOf(hostName) !== -1;
const isSecure = securedDomains.indexOf(hostName) !== -1;

const secure = isSecure ? 's' : '';

if(securedDomains.indexOf(hostName) !== -1) {
    currentServer = ['app', 'uat', 'dev', currentServer][securedDomains.indexOf(hostName)];
}

var port = window.location.port ? ':' + window.location.port : '';

var appUrl = `http${secure}://${hostName}${port}`;
var baseUrl = `${appUrl}/truedash/`;

import {ALL_ROLES} from './common/data/RolesHelper';

export const DATE_RANGE_CUSTOM_VALUE = 'customDate';

export const Config = {
    isDev: isDev,
    isLocal: isLocal,
    appUrl: appUrl,
    baseUrl: baseUrl,
    currentServer: currentServer,
    revisionNumber: revisionNumber,
    applicationVersion: versionNumber,
    isPhone: md.phone(),
    isTablet: md.tablet(),
    isMobile: md.mobile(),
    urlEncodedHeader: {'Content-Type': 'application/x-www-form-urlencoded'},

    timezone: 'UTC',
    
    formula: {
        types: [
            {value: '123', label: 'Numeric'},
            {value: 'time', label: 'Time'},
            {value: '%', label: 'Percent'},
            {value: '£', label: 'UK Pound'},
            {value: '€', label: 'Euro'},
            {value: '$', label: 'US Dollar'},
        ],
    },

    chartOptions: {
        colors: {
            map: ['#E9EFBF', '#E4E983', '#F1DF0F', '#F8C418', '#F8A41E', '#F6821F', '#F16029', '#EA262A', '#C02231', '#A11E24'],
        },
        symbols: {
            suffixed: ['%'],
        },
    },

    dateRanges: [
        {
            label: 'Other',
            ranges: [
                {value: 'custom', label: 'Between...', moving: {from: false, to: false}, rolling: false},
                {value: 'customWeek', label: 'Week...', moving: {from: false, to: false}, rolling: false},
                {value: 'allTime', label: 'All Time', moving: {from: false, to: true}, rolling: false},
                {value: 'cardDateRange', label: 'Card Date Range', moving: {from: false, to: true}, rolling: false},
            ],
        },
        {
            label: 'Current',
            ranges: [
                {value: 'today', label: 'Today', moving: {from: true, to: true}, rolling: true},
                {value: 'week', label: 'This Week', moving: {from: true, to: true}, rolling: true},
                {value: 'month', label: 'This Month', moving: {from: true, to: true}, rolling: true},
                {value: 'quarter', label: 'This Quarter', moving: {from: true, to: true}, rolling: true},
                {value: 'year', label: 'This Year', moving: {from: true, to: true}, rolling: true},
                {value: 'fiscalYear', label: 'This Fiscal Year', moving: {from: true, to: true}, rolling: true},
            ],
        },
        {
            label: 'Previous',
            ranges: [
                {value: 'yesterday', label: 'Yesterday', moving: {from: true, to: true}, rolling: true},
                {value: 'prevWeek', label: 'Previous Week', moving: {from: true, to: true}, rolling: true},
                {value: 'prevMonth', label: 'Previous Month', moving: {from: true, to: true}, rolling: true},
                {value: 'prevQuarter', label: 'Previous Quarter', moving: {from: true, to: true}, rolling: true},
                {value: 'prev6Months', label: 'Previous 6 Months', moving: {from: true, to: true}, rolling: true},
                {value: 'lastYear', label: 'Previous Year', moving: {from: true, to: true}, rolling: true},
                {value: "prevYearByExactDate", label: "Previous Year (Exact Day)", moving: {from: true, to: true}, rolling: true, hidden: true},
                {value: "prevYearByWeekDate", label: "Previous Year (Week Date)", moving: {from: true, to: true}, rolling: true, hidden: true},
                {value: 'prevFiscalYear', label: 'Previous Fiscal Year', moving: {from: true, to: true}, rolling: true},
                {value: 'quarterLastYear', label: 'This Quarter, Previous Year', moving: {from: true, to: true}, rolling: true},
            ],
        },
        {
            label: 'Next',
            ranges: [
                {value: 'tomorrow', label: 'Tomorrow', moving: {from: true, to: true}, rolling: true},
                {value: 'nextWeek', label: 'Next Week', moving: {from: true, to: true}, rolling: true},
                {value: 'nextMonth', label: 'Next Month', moving: {from: true, to: true}, rolling: true},
                {value: 'nextQuarter', label: 'Next Quarter', moving: {from: true, to: true}, rolling: true},
                {value: 'nextYear', label: 'Next Year', moving: {from: true, to: true}, rolling: true},
            ],
        },
        {
            label: 'Rolling',
            ranges: [
                {value: 'last7Days', label: 'Last 7 Days', moving: {from: true, to: true}, rolling: true},
                {value: 'last30Days', label: 'Last 30 Days', moving: {from: true, to: true}, rolling: true},
                {value: 'last4Weeks', label: 'Last 4 Weeks', moving: {from: true, to: true}, rolling: true},
                {value: 'last3Months', label: 'Last 3 Months', moving: {from: true, to: true}, rolling: true},
                {value: 'last6Months', label: 'Last 6 Months', moving: {from: true, to: true}, rolling: true},
                {value: 'last12Months', label: 'Last 12 Months', moving: {from: true, to: true}, rolling: true},
            ],
        },
        {
            label: 'To Full Month',
            ranges: [
                {
                    value: 'yearToFullMonth', label: 'This Year To Full Month',
                    moving: {from: true, to: true}, rolling: true,
                    help: 'From start of the year until end of last month',
                },
            ],
        },
        {
            label: 'To Date',
            ranges: [
                {
                    value: 'weekTY', label: 'This Week To Date',
                    moving: {from: true, to: true}, rolling: true,
                    help: 'From start of the week until yesterday',
                },
                {
                    value: 'monthTY', label: 'This Month To Date',
                    moving: {from: true, to: true}, rolling: true,
                    help: 'From start of the month until yesterday',
                },
                {
                    value: 'quarterTY', label: 'This Quarter To Date',
                    moving: {from: true, to: true}, rolling: true,
                    help: 'From start of the quarter until yesterday',
                },
                {
                    value: 'yearTY', label: 'This Year To Date',
                    moving: {from: true, to: true}, rolling: true,
                    help: 'From start of the year until yesterday',
                },
                {
                    value: 'fiscalYearTY', label: 'This Fiscal Year To Date',
                    moving: {from: true, to: true}, rolling: true,
                    help: 'From start of the fiscal year until yesterday',
                },
                {
                    label: 'From X to Y days ago',
                    rolling: true,
                    moving: {
                        from: true,
                        to: true,
                    },
                    value:DATE_RANGE_CUSTOM_VALUE,
                    numbers: {
                        from: 0,
                        to: 0,
                    },
                    hidden: true,
                },
            ],
        },
    ],
    freqRanges: [
        {value: 'hours', label: 'Hours'},
        {value: 'days', label: 'Days'},
        {value: 'weeks', label: 'Weeks'},
        {value: 'months', label: 'Months'},
        {value: 'quarters', label: 'Quarters'},
        {value: 'years', label: 'Years'},
    ],

    widgetSize: {
        width: 345,
        gridsterHeight: 200,
        fullSizeHeight: 290,
    },

    animationSpeed: 200, // milliseconds

    dateFormats: {
        regular: 'DD.MM.YYYY',
        regularDatePicker: 'dd.MM.yyyy',
        full: 'DD.MM.YYYY HH:mm',
        grails: 'YYYY-MM-DD HH:mm:ss.S',
    },

    timeFormats: {
        regular: 'HH:mm',
    },

    drillMap: {
        chartTypes: [
            {type: 'line', label: 'Line'},
            {type: 'spline', label: 'Spline'},
            {type: 'bar', label: 'Bar'},
            {type: 'table', label: 'Table'},
            {type: 'table-total', label: 'Table (total)'},
        ],
    },

    availableAxes: [{
        'label': 'Date',
        'type': 'Date',
    }, {
        'label': 'Label',
        'type': 'Label',
    }],

    gridsterOpts: {
        rowHeight: 100,//'match', // can be an integer or 'match'.  Match uses the colWidth, giving you square widgets.
        pushing: true, // whether to push other items out of the way on move or resize
        columns: 8, // the width of the grid, in columns
        floating: true, // whether to automatically float items up so they stack (you can temporarily disable if you are adding unsorted items with ng-repeat)
        colWidth: 'auto', // can be an integer or 'auto'.  'auto' uses the pixel width of the element divided by 'columns'
        margins: [10, 10], // the pixel distance between each widget
        outerMargin: true, // whether margins apply to outer edges of the grid
        isMobile: false, // stacks the grid items if true
        mobileBreakPoint: 600, // if the screen is not wider that this, remove the grid layout and stack the items
        mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
        minColumns: 1, // the minimum columns the grid must have
        minRows: 1, // the minimum height of the grid, in rows
        maxRows: 100,
        sparse: true,
        defaultSizeX: 2, // the default width of a gridster item, if not specifed
        defaultSizeY: 3, // the default height of a gridster item, if not specified
        minSizeY: 2,
        saveGridItemCalculatedHeightInMobile: false, // grid item height in mobile display. true- to use the calculated height by sizeY given
        resizable: {
            enabled: !md.mobile(),
            handles: ['ne', 'se', 'sw', 'nw'],
        },
        draggable: {
            enabled: !md.mobile(),
        },
    },

    user: {
        defaultPhotoUrl: 'styles/images/profile-avatar.jpg',
        roles: ALL_ROLES,
    },

    organisation: {
        defaultPhotoUrl: 'styles/images/avora-logo.svg',
        poweredByLogo: 'styles/images/powered-by-logo.svg',
    },

    dashboard: {
        defaultPhotoUrl: 'styles/images/dashboard-logo.svg',
    },

    pusher: {
        debug: false, // If this is true Pusher will log messages to dev console
        enableOnDev: true,
        appId: 'fe7ecc4da6f621d6d4e4',
    },
    
    bugsnag: {
        enabled: true,
        key: 'a39588854ad79db172e495d3e8bb7f07',
    },
    
    apiai: {
        // Brand Alley
        1: {
            client: '479b431499a94f8ab7e37020f92a9bc5',
            developer: 'c70d04652c7d49c1b6edc9744d24f148',
        },
        // Avora
        89: {
            client: '1b9732eca79542fab618f3f4e024b06f',
            developer: 'ee9ce2a1dc3d4114844f6188b2dd5578',
        },
    },
    
    auth0: {
        app: {
            domain: 'auth.avora.com',
            responseType: 'id_token token',
            clientId: 'roRF3sphqJKEWg14Ss8oIDvvtxTy9ANg',
            clientSecret: 'a6TbYVSIhJIKMrYwXfPgmRa7LnIvNBKE-wx7DFkIMnBH4SCfGnml1Kbcp15U-qII',
            profileRedirectUrl: `${appUrl}/token`
        },
        uat: {
            domain: 'auth-uat.avora.com',
            responseType: 'id_token token',
            clientId: 'VGdOo15BOrOFwJyrP7fGkB9leHEtP7Dx',
            clientSecret: 'nuZ_UXZevJLqesI0htqJ1a4KUa59zn3fhHESNPXhhfqPkhC_XiFIp7yWrG_PvCun',
            profileRedirectUrl: `${appUrl}/token`
        },
        dev: {
            domain: 'auth-dev.avora.com',
            responseType: 'id_token token',
            clientId: 'tzerAOWFCgnh3OuNtOHNZnjKlUZdMxRo',
            clientSecret: 'jlTnHohJxIKPkqvC05obVyf0FCxnox3tp9YtfmtLd5rj2P8icaZpF-AynjzU63mE',
            profileRedirectUrl: `${appUrl}/token`
        },
    },
    
    zapier: {
        url: 'https://zapier.com/platform/public-invite/6143/0be9599be83e879cc54eed5315067499/',
    },
    
    countWatchers: false,

};

console.info('Revision number: ', revisionNumber);
!Config.isDev && console.info('Application version: ', versionNumber);
