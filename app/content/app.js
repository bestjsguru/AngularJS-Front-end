'use strict';

import {Config} from './config';
import {Helpers} from './common/helpers';
import SessionCardData from './card/sessionCardData';
import bugsnag from 'bugsnag-js';

export const IS_MOBILE = !window.Location.token && (Config.isPhone || Config.isTablet || Config.isMobile);

const modules = [
    'angular-cache', 'ui.router', 'ui.bootstrap', 'ui.codemirror', 'ngAnimate', 'ngSanitize', 'ngTouch', 'auth0.auth0', 'angular-jwt',
    'gridster', 'ngCsv', 'NgSwitchery', 'ui.select', 'ui-select-infinity', 'toastr', 'sly', 'ui-templates', 'cleave.js',
    'ngMessages', 'perfect_scrollbar', 'cfp.hotkeys', 'angular-confirm', 'angularSpectrumColorpicker',
    'ngFitText', 'ui-leaflet', angularDragula(angular), 'ui.sortable', 'pusher-angular', 'ngScrollbars', 'cgNotify', 'ngQuill'
];

window.SessionCardData = new SessionCardData();
window.truedashApp = angular.module('truedashApp', modules);

if(Config.bugsnag.enabled) {
    let releaseStage = _.get({app: 'production', uat: 'staging', dev: 'development'}, Config.currentServer, 'production');
    if(Config.isLocal) releaseStage = 'development';
    
    window.bugsnagClient = bugsnag({
        'apiKey': Config.bugsnag.key,
        'appVersion': Config.revisionNumber,
        'releaseStage': releaseStage,
        'notifyReleaseStages': [ 'production', 'staging' ],
    });
    
    if(releaseStage !== 'development') {
        window.truedashApp.factory('$exceptionHandler', function() {
            return function(exception, cause) {
                window.bugsnagClient.notify(exception, {
                    beforeSend: function(report) {
                        report.updateMetaData('angular', {cause: cause})
                    }
                });
            }
        });
    }
}

truedashApp.config(($provide, $qProvider, uiSelectConfig, $compileProvider, fitTextConfigProvider, ScrollBarsProvider) => {
    
    if(!Config.isDev) {
        // new version of angular throws a lot of possibly unhandled rejections so we disable those kind of errors on production
        $qProvider.errorOnUnhandledRejections(false);
    }

    // Set default select theme
    uiSelectConfig.theme = 'select2';
    uiSelectConfig.searchEnabled = false;
    uiSelectConfig.resetSearchInput = true;

    // turn off debugging for production
    $compileProvider.debugInfoEnabled(document.URL.indexOf('app.truedash') <= -1);

    fitTextConfigProvider.config = {
        debounce: _.debounce,   // include a vendor function like underscore or lodash
        delay: 300,             // debounce delay
        loadDelay: 300,         // global default delay before initial calculation
        compressor: 1,          // global default calculation multiplier
        min: 10,                // global default min
        max: 125                // global default max

    };

    ScrollBarsProvider.defaults = {
        scrollButtons: {
            scrollAmount: 'auto', // scroll amount when button pressed
            enable: true // enable scrolling buttons by default
        }
    };

    $provide.decorator('$http', ["$delegate", "$q", function ($delegate, $q) {
        var getFn = $delegate.get;
        var postFn = $delegate.post;
        var cancelerMap = {};

        function getCancelerKey(method, url, data = {}) {
            var formattedMethod = method.toLowerCase();
            var formattedUrl = encodeURI(url).toLowerCase().split("?")[0];
            return formattedMethod + "~" + formattedUrl + "~" + Helpers.genHash(data);
        }

        $delegate.get = function () {
            var cancelerKey, canceler, method;
            var args = [].slice.call(arguments);
            var url = args[0];
            var config = args[1] || {};
            if (config.timeout == null) {
                method = "GET";
                cancelerKey = getCancelerKey(method, url);
                canceler = $q.defer();
                cancelerMap[cancelerKey] = canceler;
                config.timeout = canceler.promise;
                args[1] = config;
            }
            return getFn.apply(null, args);
        };

        $delegate.post = function () {
            var cancelerKey, canceler, method;
            var args = [].slice.call(arguments);
            var url = args[0];
            var data = args[1] || {};
            var config = args[2] || {};
            if (config.timeout == null) {
                method = "POST";
                cancelerKey = getCancelerKey(method, url, data);
                canceler = $q.defer();
                cancelerMap[cancelerKey] = canceler;
                config.timeout = canceler.promise;
                args[2] = config;
            }
            return postFn.apply(null, args);
        };

        $delegate.abort = function (request) {
            var cancelerKey, canceler;
            cancelerKey = getCancelerKey(request.method, request.url, request.data || {});
            canceler = cancelerMap[cancelerKey];

            if (canceler != null) {
                console.log(`Aborting: ${cancelerKey}`);

                if (request.timeout != null && typeof request.timeout !== "number") {

                    canceler.resolve();
                    delete cancelerMap[cancelerKey];
                }
            }
        };

        $delegate.abortAllByUrl = function (url) {
            let formattedUrl = "~" + encodeURI(Config.baseUrl + url).toLowerCase().split("?")[0] + "~";

            let cancelers = Object.keys(cancelerMap)
                .filter(key => key.includes(formattedUrl))
                .reduce((obj, key) => {
                    obj[key] = cancelerMap[key];
                    return obj;
                }, {});

            Object.keys(cancelers).forEach(key => {
                let canceler = cancelerMap[key];

                if (canceler != null) {
                    console.log(`Aborting: ${key}`);

                    canceler.resolve();
                    delete cancelerMap[key];
                }
            });

        };

        return $delegate;
    }]);
});

function configureDatetime(uibDatepickerConfig, uibDatepickerPopupConfig, uibTimepickerConfig) {
    // Datepicker configuration
    uibDatepickerConfig.showWeeks = true;
    uibDatepickerConfig.startingDay = 1;
    uibDatepickerPopupConfig.showButtonBar = false;

    // Timepicker configuration
    uibTimepickerConfig.mousewheel = false;
    uibTimepickerConfig.showMeridian = false;
}

truedashApp.run((Auth, $timeout, gridsterConfig, $rootScope, $window, $document, $templateCache, NotificationMessage,
                 $templateRequest, uibDatepickerConfig, uibDatepickerPopupConfig, uibTimepickerConfig) => {

    // Make Auth globally accessible
    window.Auth = Auth;
    
    // Set default timezone
    moment.tz.setDefault(Config.timezone);

    Auth.on('logout', () => NotificationMessage.closeAll());
    
    function resizeStopHandler(evt, $element, itemOptions) {
        $timeout(() => {
            $element.find('.numeric-data').trigger('resize');
        });
        $rootScope.$broadcast('gridsterResizeEnd', $element);
        placementHandler(evt, $element, itemOptions);
    }

    function placementHandler(evt, $element, itemOptions) {
        let item = angular.element($element).controller('gridsterItem');
        itemOptions.updateCardPlacement({
            row: item.row,
            col: item.col,
            sizeX: item.sizeX,
            sizeY: item.sizeY
        });

        $rootScope.$broadcast('popover.hide');
    }

    function hideAllPopovers(){
        $rootScope.$broadcast('popover.hide');
    }

    //todo: better replace to ctrl/directive - not used whole app
    angular.extend(gridsterConfig, Config.gridsterOpts);
    gridsterConfig.draggable.start = hideAllPopovers;
    gridsterConfig.draggable.stop = placementHandler;
    gridsterConfig.resizable.stop = resizeStopHandler;
    gridsterConfig.draggable.handle = 'div.card-info, div.card-info .card-name, div.card-info .card-range';

    // Bind to window resize event
    angular.element($window).bind('resize', _.debounce(() => $rootScope.$broadcast('resize'), 200));

    //@todo: replace to own service to manage all handlers
    $rootScope.$on('$stateChangeStart', () => {
        $window.onbeforeunload = null;
    });

    if (IS_MOBILE) {
        const DATATABLE_TEMPLATE_URL = 'content/card/datatable/datatable.html';
        $templateRequest(DATATABLE_TEMPLATE_URL).then(datatableTemplateHtml => {
            let datatableTemplateElement = angular.element(datatableTemplateHtml);
            datatableTemplateElement
                .find('perfect-scrollbar.scroller-x')
                .attr('ng-scrollbars','')
                .attr('ng-scrollbars-config', '$ctrl.config');
            $templateCache.put(DATATABLE_TEMPLATE_URL, datatableTemplateElement.html());
        });
    }

    configureDatetime(uibDatepickerConfig, uibDatepickerPopupConfig, uibTimepickerConfig);
});

// Overrides existing dropdown directive so that it triggers only on attribute and not on class too
angular.module('ui.bootstrap.dropdownToggle', []).directive('dropdownToggle', ($document, $location) => {
    let openElement = null;
    let closeMenu = angular.noop;

    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            scope.$watch('$location.path', () => {
                closeMenu();
            });
            element.parent().bind('click', () => {
                closeMenu();
            });
            element.bind('click', (event) => {

                let elementWasOpen = element === openElement;

                event.preventDefault();
                event.stopPropagation();

                if (!!openElement) {
                    closeMenu();
                }

                if (!elementWasOpen && !element.hasClass('disabled') && !element.prop('disabled')) {
                    element.parent().addClass('open');
                    openElement = element;
                    closeMenu = (event) => {
                        if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        $document.unbind('click', closeMenu);
                        element.parent().removeClass('open');
                        closeMenu = angular.noop;
                        openElement = null;
                    };
                    $document.bind('click', closeMenu);
                }
            });
        }
    };
});
