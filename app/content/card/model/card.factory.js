"use strict";

import {Card} from './card.model';
import {VirtualCard} from './card.virtual.model';
import {defaultCardData} from './../data/card.defaultData';

truedashApp.service('CardFactory',
    (CardCompareFactory, CardGroupingsFactory, CardFormulasFactory, CardMetricsFactory, CardFiltersFactory, CardTypesFactory, CardCacheHelperService,
     CardFrequenciesFactory, $q, DataProvider, CardPositioningFactory, AnnotationsFactory,
     Auth, UserService, CardCohortFactory, CardTableFactory, DateRangeService, $filter, CardDrillFactory, CardImageFactory,
     DashboardCacheHelperService, AppEventsService, AlertsFactory, $state, $injector) => {
        let CardFactory = {
            create: (dashboard, cardData = defaultCardData) => {

                return new Card(dashboard, cardData, CardCompareFactory, CardGroupingsFactory, CardFormulasFactory, CardFactory,
                    CardMetricsFactory, CardFiltersFactory, CardTypesFactory, CardCacheHelperService,
                    CardFrequenciesFactory, $q, DataProvider, CardPositioningFactory, AnnotationsFactory,
                    Auth, UserService, CardCohortFactory, CardTableFactory, DateRangeService, $filter, CardDrillFactory, CardImageFactory,
                    $injector.get('DashboardCollection'), DashboardCacheHelperService, AppEventsService, AlertsFactory, $state);
            },
            isCard: (obj) => obj instanceof Card,
            /**
             * @param {Card} card
             */
            transformToVirtual: (card) => {
                return new VirtualCard(card.dashboard, card.rawData, CardCompareFactory, CardGroupingsFactory, CardFormulasFactory, CardFactory,
                    CardMetricsFactory, CardFiltersFactory, CardTypesFactory, CardCacheHelperService,
                    CardFrequenciesFactory, $q, DataProvider, CardPositioningFactory, AnnotationsFactory,
                    Auth, UserService, CardCohortFactory, CardTableFactory, DateRangeService, $filter, CardDrillFactory, CardImageFactory,
                    $injector.get('DashboardCollection'), DashboardCacheHelperService, AppEventsService, AlertsFactory, $state);
            }
        };

        return CardFactory;
    });
