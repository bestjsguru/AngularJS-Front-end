'use strict';

import {Config} from './config';
import Location from './common/location';

truedashApp.run(($rootScope, $location, $state, Auth, Token, toaster, $uibModalStack, $timeout, $urlRouter,
                 RedirectService, $q, authManager, $injector, AnalyticsSegment) => {

    // Make $injector globally accessible
    window.$injector = $injector;
    window.Location = new Location($location);

    if(window.Location.isEmbed) {
        // If it is embedded login we want to clear user session
        // whenever page is refreshed so each time we will get new token
        Auth.clearEmbeddedSession();
    }
    
    Auth.initUser();

    authManager.checkAuthOnRefresh();
    authManager.redirectWhenUnauthenticated();

    $rootScope.$on('$locationChangeSuccess', function(e) {
        // Prevent $urlRouter's default handler from firing
        e.preventDefault();

        Auth.handleLogin().then(() => {
            // Once the user has logged in, sync the current URL to the router:
            $urlRouter.sync();
    
            AnalyticsSegment.page();
        }).catch(error => {
            console.log(error);
        });
    });

    $rootScope.$on('$stateChangeSuccess', (event, current) => {
        $timeout(() => {
            $rootScope.pageTitle = current.title ? `AVORA - ${current.title}` : 'AVORA';
        });

        // Remove all opened modals and popovers when route changes
        $uibModalStack.dismissAll();
        angular.element('.popover').remove();

        window.Location.set($location);
    });

    $rootScope.$on('$stateChangeStart', (e, toState, toParams) => {

        $rootScope.$on('tokenHasExpired', () => {
            $state.go('login');
        });

        let loginPage = $state.includes('login') || toState.name.includes('login');
        let logoutPage = $state.includes('logout') || toState.name.includes('logout');

        // If auth is set to public then there is no need to check if user is logged in or not
        let pageRequiresAuth = toState.data.auth !== 'public' && !loginPage && !logoutPage;

        if (!pageRequiresAuth) return;

        if (!Auth.isLoggedIn()) {
            e.preventDefault();
            RedirectService.rememberCurrentState(toState.name, toParams);

            $state.go('login');
        } else if (!Auth.user.canAccess(toState.data.auth)) {
            e.preventDefault();

            $state.go('home');
            toaster.error('You are not authorized to view that page');
        }
    });

    // Configures $urlRouter's listener *after* your custom listener
    $urlRouter.listen();
});

truedashApp.config(($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, angularAuth0Provider, jwtOptionsProvider) => {

    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise('/404');

    $urlRouterProvider.when(/^\/ng/, ['$match', function ($match) {
        console.log('ng otherwise',$match.input.replace('/ng', ''), $match.input, $match);
        return $match.input.replace('/ng', '');
    }]);

    // Prevent $urlRouter from automatically intercepting URL changes;
    // this allows you to configure custom behavior in between
    // location changes and route synchronization:
    $urlRouterProvider.deferIntercept();


    // Initialization for the angular-auth0 library
    angularAuth0Provider.init({
        clientID: Config.auth0[Config.currentServer].clientId,
        domain: Config.auth0[Config.currentServer].domain,
        responseType: Config.auth0[Config.currentServer].responseType,
        // audience: 'https://dev.avora.io',
        redirectUri: `${Config.appUrl}/callback`,
        scope: 'openid profile email'
    });

    $stateProvider
        .state('index', {
            url: '/',
            controller: ($state, Auth) => {
                if (Auth.isLoggedIn()) {
                    $state.go('home');
                } else {
                    $state.go('login');
                }
            },
            data: {auth: 'public'}
        })
        .state('callback', {
            url: '/callback',
            template: '<app-login-callback></app-login-callback>',
            title: 'Callback',
            data: {auth: 'public'}
        })
        .state('token', {
            url: '/token',
            template: '<app-token-callback></app-token-callback>',
            title: 'Token Callback',
            data: {auth: 'public'}
        })
        .state('login', {
            url: '/login',
            template: '<app-login></app-login>',
            title: 'Login',
            data: {auth: 'public'}
        })
        .state('logout', {
            url: '/logout',
            controller: (Auth) => {
                Auth.logout();
            },
            template: '<loader ctrl-check="true"></loader>',
            title: 'Logout',
            data: {auth: 'public'}
        })
        .state('home', {
            url: '/home',
            template: '<app-home></app-home>',
            title: 'Home',
            data: {auth: 'all'}
        })
        .state('dashboard', {
            url: '/dashboard/:dashboardId',
            template: '<tu-dashboards-page></tu-dashboards-page>',
            params: {
                dashboardId: null
            },
            title: 'Dashboard',
            data: {auth: 'all'}
        })
        .state('dashboardSlideshow', {
            url: '/dashboard/{dashboardId}/slideshow',
            title: 'Slideshow',
            params: {
                dashboardId: {value: null}
            },
            template: `<app-dashboard-slideshow></app-dashboard-slideshow>`,
            data: {auth: 'all'}
        })
        .state('profile', {
            url: '/profile',
            template: '<div ui-view></div>',
            title: 'Profile',
            data: {auth: 'view'}
        })
        .state('profile.organisation', {
            url: '/organisation?tab',
            template: '<app-organisation></app-organisation>',
            title: 'Organisation',
            params: {
                tab: {value: 'info'}
            },
            data: {auth: 'admin'}
        })
        .state('profile.members', {
            url: '/organisation/members',
            template: '<tu-organisation-members></tu-organisation-members>',
            title: 'Members',
            data: {auth: 'admin'}
        })
        .state('profile.activity', {
            url: '/activity',
            template: '<tu-activity></tu-activity>',
            title: 'Activity',
            data: {auth: 'user'}
        })
        .state('profile.profile', {
            url: '/details?tab',
            template: '<tu-profile-details></tu-profile-details>',
            title: 'User details',
            params: {
                tab: {value: 'info'}
            },
        })
        .state('profile.alert', {
            url: '/alert',
            template: '<tu-profile-alerts />',
            title: 'Alerts'
        })
        .state('profile.dashboards', {
            url: '/dashboards',
            template: '<tu-organize-dashboards />',
            title: 'Dashboards',
            data: {auth: 'user'}
        })
        .state('profile.report', {
            url: '/report',
            template: '<tu-profile-reports />',
            title: 'Report',
            data: {auth: 'user'}
        })
        .state('dataset', {
            url: '/dataset',
            template: '<app-data-source></app-data-source>',
            title: 'Dataset',
            data: {auth: 'admin'}
        })
        .state('feeds', {
            url: '/feeds',
            template: '<app-feeds></app-feeds>',
            title: 'Feeds',
            data: {auth: 'admin'}
        })
        .state('insight', {
            url: '/insight/{sourceId}',
            template: '<app-insight></app-insight>',
            title: 'Data source insight',
            params: {
                sourceId: {value: null},
            },
            data: {auth: 'admin'}
        })
        .state('cardExplore', {
            url: '/card/{cardId}/explore?alert&tab&dashboardId',
            title: 'Explore',
            params: {
                cardId: {value: null},
                tab: {value: 'annotations'},
                dashboardId: {value: null}
            },
            template: `<tu-explore></tu-explore>`,
            data: {auth: 'all'}
        })
        .state('cardBuilder', {
            url: '/card/:cardId?dashboardId&tab&metricId',
            title: 'Card builder',
            params: {
                tab: {value: 'general'},
                cardId: {value: null},
                metricId: {value: null},
                dashboardId: {value: null}
            },
            template: '<app-builder></app-builder>',
            data: {auth: 'user'}
        })
        .state('anomalyDetection', {
            url: '/anomaly?layout&page&size&metric&frequency&alertLevel&isAnomaly&isGood',
            title: 'Anomaly detection',
            params: {
                layout: {value: '2columns'},
                page: {value: '1'},
                size: {value: '10'},
                metric: {value: null},
                frequency: {value: null},
                alertLevel: {value: null},
                isAnomaly: {value: null},
                isGood: {value: null}
            },
            template: '<tu-anomaly-detection></tu-anomaly-detection>',
            data: {auth: 'user'}
        })
        .state('cohort', {
            url: '/cohort',
            templateUrl: 'content/cohort/cohort.html',
            data: {auth: 'user'}
        })
        .state('404', {
            url: '/404',
            templateUrl: '404.html',
            title: '404',
            data: {auth: 'public'}
        })
        .state('metricBuilder', {
            url: '/metricBuilder/:metricId',
            template: '<tu-metric-builder></tu-metric-builder>',
            params: {
                metricId: null
            },
            title: 'Metric builder',
            data: {auth: 'user'}
        })
        .state('automationBuilder', {
            url: '/automationBuilder',
            template: '<tu-automation-builder></tu-automation-builder>',
            title: 'Automation builder',
            data: {auth: 'user'}
        })
        .state('relationshipBuilder', {
            url: '/relationshipBuilder/:relationId?tab',
            template: '<app-relationship-builder></app-relationship-builder>',
            params: {
                relationId: null,
                tab: {value: 'relation'}
            },
            title: 'Relationship Builder',
            data: {auth: 'user'}
        })
        .state('rootCause', {
            url: '/rootCause/:relationId?autoCalculate&{current:json}&{previous:json}',
            template: '<app-root-cause></app-root-cause>',
            params: {
                relationId: null,
                autoCalculate: 'false',
                current: {
                    fromDate: null,
                    toDate: null,
                    rangeName: 'custom'
                },
                previous: {
                    fromDate: null,
                    toDate: null,
                    rangeName: 'custom'
                }
            },
            title: 'Root cause',
            data: {auth: 'user'}
        })
        .state('forecastAnalysis', {
            url: '/forecastAnalysis?actualMetricId&forecastMetricId&{date:json}',
            template: '<app-forecast-analysis></app-forecast-analysis>',
            params: {
                actualMetricId: null,
                forecastMetricId: null,
                date: {
                    fromDate: null,
                    toDate: null,
                    rangeName: 'custom'
                },
            },
            title: 'Forecast Analysis',
            data: {auth: 'user'}
        })
        .state('keyDrivers', {
            url: '/keyDrivers?actualMetricId&{date:json}',
            template: '<app-key-drivers></app-key-drivers>',
            params: {
                actualMetricId: null,
                date: {
                    fromDate: null,
                    toDate: null,
                    rangeName: 'custom'
                },
            },
            title: 'Key Drivers',
            data: {auth: 'user'}
        })
        .state('schemaDesign', {
            url: '/schemaDesign',
            template: '<tu-schema-design></tu-schema-design>',
            title: 'Schema Design',
            data: {auth: 'user'}
        })
        .state('mapTest', {
            url: '/mapTest',
            template: '<tu-geo-map></tu-geo-map>',
            title: 'Geo Map',
            data: {auth: 'user'}
        })
        .state('cardEmbed', {
            url: '/card/{cardId}/embed',
            title: 'Embed',
            params: {
                cardId: {value: null}
            },
            template: `<tu-card-embed></tu-card-embed>`,
            data: {auth: 'user'}
        })
        .state('databaseExplorer', {
            url: '/databaseExplorer?tab&table',
            template: '<app-database-explorer></app-database-explorer>',
            title: 'Database Explorer',
            params: {
                tab: {value: 'sql'},
                table: null
            },
            data: {auth: 'user'}
        })
        .state('smartAlerts', {
            url: '/smartAlerts?layout&page&size&metric&show&level&frequency&isGood',
            template: '<app-smart-alerts></app-smart-alerts>',
            title: 'Smart Alerts',
            params: {
                layout: {value: '3columns'},
                page: {value: '1'},
                size: {value: '10'},
                metric: {value: null},
                show: {value: 'all'},
                level: {value: null},
                frequency: {value: null},
                isGood: {value: null},
            },
            data: {auth: 'user'}
        })
        .state('createMetricAlert', {
            url: '/createMetricAlert',
            template: '<app-create-metric-alert></app-create-metric-alert>',
            title: 'Create Metric Alert',
            data: {auth: 'admin', viewMode: 'create'}
        })
        .state('updateMetricAlert', {
            url: '/updateMetricAlert/{alertId}',
            template: '<app-create-metric-alert></app-create-metric-alert>',
            title: 'Update Metric Alert',
            data: {auth: 'admin', viewMode: 'update'}
        })
        .state('alerts', {
            url: '/alerts/:metricId?layout&page&size&metric&show&level&frequency&isGood',
            template: '<app-metric-alerts></app-metric-alerts>',
            title: 'Metric Alerts',
            params: {
                metricId: null,
                layout: {value: null},
                page: {value: null},
                size: {value: null},
                metric: {value: null},
                show: {value: null},
                level: {value: null},
                frequency: {value: null},
                isGood: {value: null},
            },
            data: {auth: 'user'}
        })
        .state('playground', {
            url: '/playground',
            template: '<app-apiai></app-apiai>',
            title: 'Api.ai',
            data: {auth: 'admin'}
        })
        .state('newTextCard', {
            url: '/textCard/new?dashboardId',
            params: {
                dashboardId: {
                    type: 'int',
                    value: null
                }
            },
            template: '<app-text-card-builder></app-text-card-builder>',
            title: 'Create text card',
            data: {auth: 'user'}
        })
        .state('editTextCard', {
            url: '/textCard/{cardId}/edit',
            template: '<app-text-card-builder></app-text-card-builder>',
            title: 'Update text card',
            data: {auth: 'user'},
            params: {
                cardId: {
                    type: 'int',
                    value: null
                }
            }
        })
        .state('new', {
            url: '/new',
            template: '<div ui-view></div>',
            title: 'New',
            data: {auth: 'view'}
        })
        .state('new.tables', {
            url: '/tables',
            template: '<app-new-tables></app-new-tables>',
            title: 'Tables',
            data: {auth: 'view'}
        });

    $httpProvider.interceptors.push(['$rootScope', '$q', '$injector', function($rootScope, $q, $injector) {
        return {
            response: function (response) {
                return response;
            },
            responseError: function (rejection) {
                let status = rejection.status;

                let loginPage = rejection.config.url.includes('login');
                let logoutPage = rejection.config.url.includes('logout');

                if ([401, 403].indexOf(status) > -1 && !loginPage && !logoutPage) {
                    console.error(`${status} status received: ${rejection.config.url}`);
                    window.bugsnagClient.notify(`${status} status received: ${rejection.config.url}`, {severity: 'info'});

                    //to break circular dependency and keep code in Auth service
                    /** @type {Auth} **/
                    let Auth = $injector.get('Auth');

                    if (Auth.isLoggedIn() && status === 403) {
                        window.bugsnagClient.notify(`User is logged in but without permission to access this content`, {severity: 'info'});
                        const toaster = $injector.get('toaster');
                        toaster.error("You don't have permissions to access this content");
                    }
                }

                // otherwise
                return $q.reject(rejection);
            }
        };
    }]);

    jwtOptionsProvider.config({
        unauthenticatedRedirector: ['$injector', function($injector) {

            console.log('unauthenticatedRedirector');

            /** @type {Auth} **/
            let Auth = $injector.get('Auth');
            Auth.clearHttpRequests();
            Auth.clearSession();

            // Remember current url so we can redirect user back after login
            const service = $injector.get('RedirectService');
            service.rememberCurrentState();

            Auth.redirectToLogin();
        }],
        whiteListedDomains: ['app.avora.com', 'uat.avora.com', 'dev.avora.com', 'local.avora.com']
    });

    $httpProvider.interceptors.push('jwtInterceptor');
});
