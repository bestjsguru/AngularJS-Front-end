'use strict';

import './cellFormat/cellFormat.directive';
import {MetricModel} from '../model/metric.model.js';
import {CohortsColouring} from './cohortsColouring';

class DataTableCtrl {

    constructor($scope, $filter, $element, datatableTransformerFactory, $rootScope, DeregisterService, $q, $state, $document) {
        this.$q = $q;
        this.$scope = $scope;
        this.$state = $state;
        this.$filter = $filter;
        this.$element = $element;
        this.$document = $document;
        this.$rootScope = $rootScope;
        this.datatableTransformerFactory = datatableTransformerFactory;

        this.watchers = DeregisterService.create(this.$scope);

        this.cohortsColouring = new CohortsColouring($element, $scope);

        this.currentPage = 1;
        this.datatableTransformer = {};
        this.isCohort = false;
        this.isComplexityCohort = false;

        this.columnsMap = {};

        this.$rootScope.dtCtrl = this;

        this.config = {
            autoHideScrollbar: false,
            theme: 'dark-3',
            advanced:{
                updateOnContentResize: true
            },
            scrollInertia: 0,
            axis: 'xy'
        };
    }

    $postLink() {
        this.watchers.watch('$ctrl.isLoading()', loading => {
            let element = this.$element.find('.card-content');

            if (loading) {
                element.addClass('chart-loading');
            } else  {
                this.watchers.timeout(() => {
                    element.removeClass('chart-loading');
                }, 3000);
            }
        });
    }

    $onInit() {
        this.columnSorting = this.card.columnSorting;

        this.card.metrics.on('added removed loaded', () => this.repaintTable, this);
        this.card.drill.on('drillDown drillUp', this.repaintTable, this);

        this.watchers.on('explore.exploreModeReloaded', () => this.init());
        this.watchers.watch('$ctrl.card.metrics.originalData', (oldVal, newVal) => {
            !this.initializing && this.isCohort && this.watchers.timeout(() => this.cohortsColouring.updateTable(), 100);
            
            !this.initializing && this.repaintTable();
        });

        this.init();
    }

    $onDestroy() {
        this.card.metrics.off(null, null, this);
        this.card.drill.off(null, null, this);
        this.$rootScope.dtCtrl = null;
    }

    init(skipLoad = false) {
        this.initializing = true;
        let promise = this.$q.when();
        
        if (!skipLoad) {
            promise = this.card.isVirtual() ? this.card.metrics.getLoadDataPromise() : this.card.metrics.getLoadPromise();
        }
        
        return promise.then(() => {
            if(this.card.metrics.error) {
                return this.$q.reject('Metrics loading error: ' + this.card.metrics.errorMessage);
            }
        }).then(() => {
            this.initializeColumnsOrder();
            this.datatableTransformer = this.datatableTransformerFactory.transform(this.card);
            
            this.card.originalColumnOrder = this.datatableTransformer.metricData.columns;
            this.setColumnsMap(this.card.originalColumnOrder, this.card.originalColumnOrder);

            if (this.isCohort && !this.card.metrics.get(0).info.cohort)
                this.cohortsColouring.resetCellColours();
            this.isCohort = this.card.metrics.get(0).info.cohort;
            this.isComplexityCohort = this.card.metrics.get(0).info.cohort && this.card.metrics.get(0).isSQLBased();
            this.isCohort && this.calculateCohortTotals();
            this.columnSorting.init();
        }).then(() => {
            this.initFormattingOptions();
            this.createTransposeTableModel();
            this.watchers.timeout(() => {
                this.$rootScope.$emit('datatablePageChanged');
                this.isCohort && this.cohortsColouring.updateTable();
                !this.isCohort && this.cohortsColouring.triggerDomUpdate();
            }, 100);
        }).finally(() => {
            this.loading = false;
            this.initializing = false;
        }).catch(angular.noop);
    }

    isTranspose() {
        return this.card.isTransposeTable;
    }

    createTransposeTableModel() {
        // TODO Sometimes it happens that topHeaders is undefined so I tried to catch the error here
        // If caught it should display inside Sentry application errors and we should check it there soon
        if(!Object.keys(this.datatableTransformer).length) {
            console.error('createTransposeTableModel undefined topHeaders', this.datatableTransformer);
            return;
        }

        let headers = this.datatableTransformer.topHeaders.length > 0 ? this.datatableTransformer.topHeaders : this.datatableTransformer.metricData.columns;
        let table;
        if (this.datatableTransformer.multiheader) {
            let columns = this.datatableTransformer.metricData.columns;
            let numberOfGroupingColumns = Math.round((columns.length - 1) / (headers.length - 1));
            let headersWithIntervals = headers.slice(1, headers.length).map(i => [i, ...new Array(numberOfGroupingColumns - 1).fill("")]);
            let mergedHeaders = [].concat.apply([], headersWithIntervals);
            let multiHeaderWithIntervals = ['',...mergedHeaders];
            table = [multiHeaderWithIntervals, columns, ...this.datatableTransformer.metricData.results];
        } else {
            table = [headers, ...this.datatableTransformer.metricData.results];
        }
        this.transposeTable = _.zip.apply(_, table);
    }

    columnsForTransposeHeader() {
        if (this.transposeTable && this.transposeTable.length > 0) {
            return this.transposeTable[0];
        } else {
            return [];
        }
    }

    transposeResults() {
        if (this.transposeTable && this.transposeTable.length > 1) {
            let arrayCopy = [...this.transposeTable];
            arrayCopy.shift();
            return arrayCopy;
        } else {
            return [];
        }
    }

    repaintTable() {
        if(!this.card.metrics.loaded || !this.card.metrics.length || this.loading) return;
        this.initializeColumnsOrder();
        this.datatableTransformer = this.datatableTransformerFactory.transform(this.card);

        this.card.originalColumnOrder = this.datatableTransformer.metricData.columns;
        this.setColumnsMap(this.card.originalColumnOrder, this.card.originalColumnOrder);
    
        this.initFormattingOptions();
        this.createTransposeTableModel();
        this.updatePerfectScroll();
    }
    
    updatePerfectScroll() {
        this.watchers.timeout(() => {
            let yScrollerElement = this.$document.find('.scroller-y');
            if(yScrollerElement) {
                yScrollerElement.perfectScrollbar('update');
            }
            let xScrollerElement = this.$document.find('.scroller-x');
            if(xScrollerElement) {
                xScrollerElement.perfectScrollbar('update');
            }
        }, 1000);
    }

    initializeColumnsOrder() {
        this.card.metrics.items.forEach(item => {
            let id = MetricModel.getNonVirtualId(item.info);
            if (this.card.metrics.metricInfoMap[id])
                item.order = this.card.metrics.metricInfoMap[id].order;
        });
    }

    setColumnsMap(oldColumnsOrder, newColumnsOrder) {
        this.columnsMap = {};
        let newColumns = angular.copy(newColumnsOrder);

        oldColumnsOrder.forEach((column, index) => {
            let newColumnsIndex = newColumns.indexOf(column);
            this.columnsMap[newColumnsIndex] = index;
            newColumns[newColumnsIndex] = null;
        });
    }

    calculateCohortTotals() {
        this.cohortTotals = [];

        this.cohortsColouring.prepareColourMatrix(this.card.metrics.originalData.results, this.isComplexityCohort);
    }

    onPageChanged() {
        this.loading = true;
        this.card.autoReload.saveAndEnable();
        return this.card.metrics.setPage(this.currentPage, this.card.cardUpdateModel, this.columnSorting.sortOrder).finally(() => {
            this.loading = false;
            this.card.autoReload.rollback();
            this.init(true);
        });
    }

    initColumn(idx, direction = 'asc', trackColumnsSortMap = true) {
        let idxSort = !_.isEmpty(this.columnsMap) && trackColumnsSortMap ? this.columnsMap[idx] : idx;
        return this.getColumn(idx) || this.columnSorting.createColumn(
            this.datatableTransformer.metricData.columns[idx],
            direction,
            this.datatableTransformer.getColumnOriginalIdx(idxSort)
        );
    }

    setSorting(idx) {
        //prevent the situation when user starts clicking several times on the column header
        if(this.isColumnSortRunning) return;
        this.isColumnSortRunning = true;

        if (!this.columnSorting.canSort()){
            this.isColumnSortRunning = false;
            return;
        }

        var column = this.initColumn(idx);

        this.columnSorting.set(column);

        this.loading = true;
        let isDashboardFiltersEnabled = this.card.cardUpdateModel ? true : false;

        let promise;
        if (!this.card.isVirtual()) {
            promise = this.card.metrics.load(false, false, isDashboardFiltersEnabled, this.columnSorting.sortOrder);
        } else {
            this.card.autoReload.saveAndEnable();
            promise = this.card.metrics.loadData(false, isDashboardFiltersEnabled);
        }

        promise.finally(() => {
            this.onSortingPromiseSuccess();
        });
    }

    onSortingPromiseSuccess() {
        this.init(true);
        this.isColumnSortRunning = false;
        this.card.autoReload.rollback();
    }

    getColumn(idx) {
        let idxSort = !_.isEmpty(this.columnsMap) ? this.columnsMap[idx] : idx;
        
        return this.columnSorting.getColumn(idxSort);
    }

    getColumnsSortIndex(index) {
        return this.columnSorting.getColumnIndex(this.getColumn(index));
    }

    isSortingColumn(idx)  {
        return this.getColumn(idx) !== undefined;
    }

    isNoData() {
        if (!this.datatableTransformer.metricData) return true;
        return !this.loading && (!this.datatableTransformer.metricData.results || !this.datatableTransformer.metricData.results[0]);
    }

    showHeader() {
        return !this.isNoData();
    }

    getTableTotals() {
        let totals = this.card.getTableTotals();

        if (this.card.frequencies.isTotalSelected() && this.card.groupings.length && !_.isEmpty(this.columnsMap)) {
            let orderedTotals = [];
            if (_.keys(this.columnsMap).length === totals.length) {
                totals.forEach((total, index) => orderedTotals.push(totals[this.columnsMap[index]]));
            }
            totals = orderedTotals;
        }
        
        totals = totals.map((total) => {
            return total.format ? this.$filter('value')(total.value, total.format, false, false, total.metric.numberOfDecimals) : total.value;
        });
        
        // If every value is null than we remove table totals table row
        if(_.every(totals, _.isNull)) return [];
    
        return totals;
    }

    isLoading() {
        return this.loading || this.initializing;
    }

    onRowClicked(idx) {
        //todo: this ugly piece of code is for drill down. will be most likely broken in any other usage
        this.$rootScope.$broadcast('DataTable.click', this.datatableTransformer.metricData.results[idx][0]);
    }

    showHorizontalPagination() {
        return this.card.groupings.length && this.card.cardTable &&
               !this.card.frequencies.isTotalSelected() && !this.card.frequencies.isGrainSelected() && !this.isLoading();
    }

    hasDashboardFilters(column) {
        if(!this.tuCard) return false;

        const filters = this.tuCard.cardDashboardFilters();
        if (filters && filters.activeCardColumnsMap && filters.activeCardColumnsMap[this.card.id]) {
            return !!filters.activeCardColumnsMap[this.card.id].find(c => c.name === column || c.label === column);
        }
        return false;
    }

    transposedRowIndex(rowIndex, columnIndex) {
        if(this.isNumericOrTotalTable()) {
            return rowIndex;
        }
        
        return columnIndex - (this.datatableTransformer.multiheader ? 2 : 1);
    }

    transposedColumnIndex(rowIndex, columnIndex) {
        if(this.isNumericOrTotalTable()) {
            return columnIndex - 1;
        }
    
        return rowIndex + 1;
    }
    
    isNegativeValue(value) {
        return _.startsWith(value, '-');
    }
    
    initFormattingOptions() {
        this.formattingOptions = {
            results: this.datatableTransformer.metricData.results,
            columns: this.datatableTransformer.metricData.columns,
        };
    
        if(this.isNumericOrTotalTable()) {
            this.formattingOptions.columns = this.formattingOptions.results.map(result => result[0]);
            this.formattingOptions.results = this.formattingOptions.results.map(result => result[1]);
        }
    }
    
    isNumericOrTotalTable() {
        let totalTable = this.card.metrics.length > 1 && this.card.frequencies.isTotalSelected() && !this.card.groupings.length;
        return this.card.types.get() === 'numeric' || totalTable;
    }
    
    regularRowIndex(rowIndex, columnIndex) {
        if(this.isNumericOrTotalTable()) {
            return columnIndex - 1;
        }
        
        return rowIndex;
    }
    
    regularColumnIndex(rowIndex, columnIndex) {
        if(this.isNumericOrTotalTable()) {
            return rowIndex;
        }
        
        return columnIndex;
    }
}

truedashApp.component('tuDatatable', {
    bindings: {
        card: '=',
        loading: '<',
        noLoader: '='
    },
    require: {
        tuCard: '^?tuCard'
    },
    controller: DataTableCtrl,
    templateUrl:  "content/card/datatable/datatable.html"
});
