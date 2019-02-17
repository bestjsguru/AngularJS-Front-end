'use strict';

class ColumnDataCtrl {
    constructor(toaster, MetricDataService, DataProvider, $rootScope, ColumnCacheHelperService) {
        this.toaster = toaster;
        this.$rootScope = $rootScope;
        this.DataProvider = DataProvider;
        this.MetricDataService = MetricDataService;
        this.ColumnCacheHelperService = ColumnCacheHelperService;
        
        this.submitted = false;
        this.loading = false;
    }
    
    $onInit() {
        this.item = this.resolve.item;
        this.source = this.resolve.source;
        this.column = this.item ? this.item.value : null;
        
        // Set default display name
        this.column.displayName = this.column.displayName || this.column.name;
    }
    
    save() {
        this.submitted = true;
        
        // double click to update button fix
        if (angular.isUndefined(this.form)) this.form = {};
        
        // Don't submit if form is invalid
        if(this.form && !this.form.$invalid) {
            
            this.loading = true;
    
            return this.MetricDataService.setColumnDisplayName(this.column).then((column) => {
                this.submitted = false;
    
                this.ColumnCacheHelperService.updateColumn(column, this.source.id);
                this.DataProvider.clearUrlCache('table/columnsByTableRelation', 'GET');
    
                this.item.name = this.column.name;
                this.item.displayName = this.column.displayName;
                this.item.value = this.column;
    
                this.$rootScope.$broadcast('insight.columnUpdated', column);
    
                this.toaster.success('Column name changed');
                
                this.dismiss();
            }).finally(() => {
                this.loading = false;
            });
        }
    }
    
    /**
     * Check if form field is dirty
     *
     * @param field
     * @returns boolean
     */
    dirty(field) {
        return (field && field.$dirty) || this.submitted;
    }
}

truedashApp.component('appColumnData', {
    controller: ColumnDataCtrl,
    templateUrl: 'content/dataset/insight/columnData/columnData.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    }
});
