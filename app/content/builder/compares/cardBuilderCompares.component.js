'use strict';

import ColorPickerConfig from '../../common/colorPicker/colorPickerConfig';

const COMPARE_RANGE_MAP = {
    'year': 'prevYear',
    'fiscalYear': 'prevFiscalYear',
    'month': 'lastMonth',
    'quarter': 'lastQuarter',
    'week': 'lastWeek',
    'today': 'yesterday'
};

const DEFAULT_COMPARE_RANGE = 'lastMonth';

class CardBuilderComparesController {

    /**
     *
     * @param {toaster} toaster
     * @param {DeregisterService} DeregisterService
     * @param {DateRangeService} DateRangeService
     */
    constructor($scope, toaster, DeregisterService, DateRangeService, $rootScope) {
        this.$scope = $scope;
        this.toaster = toaster;
        this.DeregisterService = DeregisterService;
        this.DateRangeService = DateRangeService;
        this.ColorPickerConfig = new ColorPickerConfig();
        this.$rootScope = $rootScope;

        this.watchers = DeregisterService.create(this.$scope);

        this.compares = [];

        this.isLoading = false;

        this.hiddenLabels = ['allTime', 'cardDateRange', 'today', 'week', 'month', 'quarter', 'year', 'fiscalYear',
            'lastYear', 'quarterLastYear', 'last7Days', 'last30Days', 'last4Weeks', 'last3Months',
            'last6Months', 'last12Months'];
    }

    $onInit() {
        this.card = this.cardBuilder.card;

        this.watchers.onRoot('compare.add', () => this.addNew());
        this.watchers.onRoot('cardBuilderMetrics.removedMetric', () => this.init());

        this.card.metrics.on('added', this.init, this);

        this.init();
    }

    $onDestroy() {
        this.card.metrics.off(null, null, this);
    }

    get loading() {
        return this.isLoading || this.cardBuilder.loading;
    }

    init() {
        // we will preserve all unsaved compares and add them back to the end of the list
        let unsavedCompares = this.compares.filter(compare => !compare.added);
        this.metrics = this.card.compare.getReadyForCompareList();
        this.compares = [];

        this.card.compare.getList().forEach((item) => {
            // This line is to accommodate the mixup between "Last Year" and "Previous Year" data range
            // once it's fixed on the BE, the old code (commented one) should be put back

            // with this.DateRangeService.getCompareRanges() there is always between... range
            item.range = this.DateRangeService.createByName(
                this.card.compare.getRangeName(item.info.rangeName),
                item.info.fromDate,
                item.info.toDate
            );
            // this.range = DateRangeService.createByName(compare.getRangeName(), compare.info.fromDate, compare.info.toDate, this.DateRangeService.getCompareRanges());

            item.metric = this.card.metrics.find(metric => item.isComparedTo(metric));
            item.added = true;

            this.compares.push(item);
        });

        this.compares = [...this.compares, ...unsavedCompares];
    }

    updateMetricList(removedCompare) {
        this.metrics = this.card.compare.getReadyForCompareList();

        // if selected compare is removed we need to unselect it from select list
        if(removedCompare) this.compares.forEach(compare => {
            if(compare.metric.id == removedCompare.id) compare.metric = undefined;
        });
    }

    addNew() {
        this.compares.push({
            metric: this.metrics[this.compares.length % this.metrics.length],
            range: this.getDefaultRange(),
            color: null,
            info: {
                hidden: false
            }
        });
    }

    getDefaultRange() {
        let compareRangeName = COMPARE_RANGE_MAP[this.currentRangeName] || DEFAULT_COMPARE_RANGE;
        return this.DateRangeService.createByName(compareRangeName);
    }

    add(index) {

        let compare = this.compares[index];

        if(!compare.range.validate()){
            return this.toaster.error('Compare has invalid metric-range.');
        }

        this.isLoading = true;
        this.card.columnSorting.sortOrder = [];
        this.card.compare.addAll([compare]).finally(() => {
            compare.added = true;
            this.isLoading = false;
            this.init();
        });
    }

    update(index) {

        let compare = this.compares[index];

        this.isLoading = true;

        this.card.compare.update(compare, {
            range: compare.range,
            label: compare.label,
            color: compare.color
        }).catch(message => {
            console.warn(message);
            this.toaster.warning('Cannot edit compare');
        }).finally(()=> {
            this.updateMetricList();
            this.isLoading = false;
        });
    }

    updateRange(dates, rangeName, index) {

        let compare = this.compares[index];

        compare.compareDates = {fromDate: dates.startDate.valueOf(), toDate: dates.endDate.valueOf()};

        // with this.DateRangeService.getCompareRanges() there is always between... range
        compare.range = this.DateRangeService.createByName(rangeName, dates.startDate, dates.endDate);
    }

    removeColor(index) {
        this.compares[index].color = null;
    }

    remove(index) {

        let compare = this.compares[index];
        compare.deleting = true;
        this.isLoading = true;

        this.card.columnSorting.sortOrder = [];
        this.card.compare.remove(compare).finally(() => {
            this.updateMetricList(compare);
            this.compares.splice(index, 1);
            this.isLoading = false;
        });
    }
    
    onShowCompareStatsClick() {
        this.card.showCompareStats = !this.card.showCompareStats;
        this.card.metrics.loadData();
    }
    
    toggleVisibility(compare) {
        this.card.columnSorting.sortOrder = [];
        compare.info.hidden ? this.card.compare.show(compare) : this.card.compare.hide(compare);
    
        this.$rootScope.$broadcast('popover.hide');
    }

}

truedashApp.component('appCardBuilderCompares', {
    controller: CardBuilderComparesController,
    templateUrl: 'content/builder/compares/cardBuilderCompares.html',
    require: {
        cardBuilder: '^appBuilder'
    }
});

