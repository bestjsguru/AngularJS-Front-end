'use strict';

class DataSourceCtrl {

    constructor($uibModal, DataSourceService, $state, AppEventsService) {
        this.$state = $state;
        this.$uibModal = $uibModal;
        this.AppEventsService = AppEventsService;
        this.DataSourceService = DataSourceService;

        this.dataSources = [];
        this.loading = false;
        this.error = false;
    }
    
    $onInit() {
        this.loadSources();
    }
    
    loadSources(){
        this.loading = true;
        this.DataSourceService.getList().then(list => {
            list = list.filter(item => !item.unknown);
            list.sort((a, b) => a.name.localeCompare(b.name));
            
            this.dataSources = list;
    
            this.AppEventsService.track('dataset-page');
        }).catch((error) => {
            this.error = true;
            this.message = error.message;
        }).finally(() => {
            this.loading = false;
        });
    }
    
    manage($event, dataSource) {
        $event.stopPropagation();
        $event.preventDefault();
        
        this.$state.go('insight', {sourceId: dataSource.id});
    }
}

truedashApp.component('appDataSource', {
    controller: DataSourceCtrl,
    templateUrl: 'content/dataset/dataSource/dataSource.html'
});

