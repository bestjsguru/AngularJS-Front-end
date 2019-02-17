"use strict";

import {Config} from '../../config.js';

export const defaultCardData = {
    active: true,
    multipleAxis: false,
    availableTypes: ['line', 'bar'],
    columnsSort: [],
    moving: {
        from: false,
        to: false
    },
    fromDate: moment().startOf('day').subtract(12, 'months'),
    toDate: moment().endOf('day'),
    metricInfoMap: {},
    type: 'line',
    subType: 'line',
    selectedFrequency: 'Monthly',
    yAxis: Config.availableAxes[1],
    xAxis: Config.availableAxes[0],
    selectedTotals: [],
    cardExportInfos: [],
    size: null,
    noSort: false,
    showGroupingAsPercentage: false,
    showCompareStats: true,
    showTableTotals: false,
    isTransposeTable: false,
    timezone: Config.timezone,
    useTimezone: false,
    startDayOfWeek: 1,
    useStartDayOfWeek: false,
    fillChart: false,
    showTrendLine: false,
    extendTrendLine: null,
    showValueLabels: false,
    description: '',
    name: '',
    rangeName: 'last12Months',
    columnsMap: {},
    join: null,
    goal: null
};
