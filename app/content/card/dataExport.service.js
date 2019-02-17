'use strict';

class DataExportService {
    constructor($state, $rootScope, DataProvider, toaster, $q, DeregisterService, AppEventsService, $location, Auth) {
        this.$q = $q;
        this.$state = $state;
        this.toaster = toaster;
        this.$location = $location;
        this.$rootScope = $rootScope;
        this.AppEventsService = AppEventsService;
        /** @type {DataProvider} **/
        this.DeregisterService = DeregisterService;
        /** @type {DeregisterService} **/
        this.DataProvider = DataProvider;
        /** @type {Auth} **/
        this.Auth = Auth;

        this.exportCardsMap = new Map();
        this.cardExportInProgress = false;
        this.allPromisesResolved = true;
        this.watchers = this.DeregisterService.create();

        this.status = {
            inProgress: false,
            message: ''
        };

        this.watchers.onRoot('dashboard.exportStart', (event, data) => {
            this.status.inProgress = true;
            if (data && data.message && data.message.length > 0) {
                this.status.message = data.message + ',<br> please be patient...';
            } else {
                this.status.message = 'Exporting dashboard,<br> please be patient...';
            }

        });
        this.watchers.onRoot('card.exportStart', () => {
            this.status.inProgress = true;
            this.status.message = 'Exporting card,<br> please be patient...';
        });
        this.watchers.onRoot(['dashboard.exportEnd', 'card.exportEnd'], () => {
            this.status.inProgress = false;
            this.status.message = '';
        });
    }

    getStatus() {
        return this.status;
    }

    formatFileName(name){
        return `export-${name}-${moment().format('YYYY-MM-DD')}`;
    }

    exportZap(info, card) {
        this.AppEventsService.track('used-zapier-export', {id: card.id, zapier: info});
    
        this.exportCardsMap.set(card.id, {timestamp: new Date().getTime()});
    
        this.$rootScope.$emit('card.exportStart', {cardId: card.id});
        
        return this.DataProvider.get('card/existingCardJSON/' + card.id, {hookId: info.id}, false).then((response) => {
            this.toaster.success('Card exported');
        }).catch(() => {
            this.toaster.error('Card could not be exported');
        }).finally(() => {
            this.exportCardsMap.delete(card.id);
            this.$rootScope.$emit('card.exportProcessEnd', {cardId: card.id});
            if (!this.cardExportInProgress) {
                this.$rootScope.$emit('card.exportEnd');
            }
        });
    }
    
    exportCard(type, card, dashboardFiltersModelForCard = undefined) {
        // We always export with virtual card data
        if (!card.isVirtual()) card.makeVirtual();

        let fileName = this.formatFileName(card.getName());
    
        let isExploreMode = ['cardExplore'].includes(this.$state.current.name);

        let exportReferences = {
            processExportReferenceId: null,
            fileName: fileName,
            timestamp: new Date().getTime()
        };
        this.exportCardsMap.set(card.id, exportReferences);

        this.$rootScope.$emit('card.exportStart', {cardId: card.id});

        let exportModel = {
            level: 'card',
            exportType: type,
            columnPosition: card.columnPosition.getVisibleJson(),
        };
    
        exportModel.id = card.id;
        exportModel.name = card.name;
        
        exportModel.organisationId = this.Auth.user.organisation.id;
        exportModel.dashboardId = card.dashboard.id;
        
        if (dashboardFiltersModelForCard) {
            exportModel.withDashboardFilters = true;
        }
    
        if(isExploreMode || card.drill.isActive() || card.drill.isRecords) {
            exportModel.card = card.getJson();
            
            // We have to check for dashboard timezone and replace default one on the card,
            // because BE won't be able to pull dashboard details for virtual cards
            if(!card.useTimezone && card.dashboard.useTimezone) {
                exportModel.card.timezone = card.dashboard.timezone;
                exportModel.card.useTimezone = card.dashboard.useTimezone;
            }
        
            // We have to check for dashboard week start and replace default one on the card,
            // because BE won't be able to pull dashboard details for virtual cards
            if(!card.useStartDayOfWeek && card.dashboard.useStartDayOfWeek) {
                exportModel.card.startDayOfWeek = card.dashboard.startDayOfWeek;
                exportModel.card.useStartDayOfWeek = card.dashboard.useStartDayOfWeek;
            }
        }

        this.AppEventsService.track('used-card-export', {id: card.id, type: type});

        let url = type === 'excel' ? 'export/excel' : 'export/cardCSV';
        
        return this.DataProvider.exportFileRequest(url, exportModel, fileName).then((response) => {

            //receive launched export process id and save it in the local Map - this.exportCardsMap
            this.exportCardsMap.get(card.id).processExportReferenceId = response.exportRequestId;
            if (!this.cardExportInProgress) this.checkIfCardExportProcessesFinished(undefined, type);

        }).catch(() => {

            this.exportCardsMap.delete(card.id);
            this.$rootScope.$emit('card.exportProcessEnd', {cardId: card.id});
            if (!this.cardExportInProgress) {
                this.$rootScope.$emit('card.exportEnd');
            }

            this.toaster.error('Card could not be exported');
        });

    }

    exportDashboardToCsv(params) {
        let fakeDashboardId = params.dashboard.id + 'd';

        let fileName = this.formatFileName(params.dashboard.name);

        let exportReferences = {
            processExportReferenceId: null,
            fileName: fileName,
            timestamp: new Date().getTime()
        };
        this.exportCardsMap.set(fakeDashboardId, exportReferences);

        this.$rootScope.$emit('card.exportStart', {cardId: fakeDashboardId});

        this.AppEventsService.track('used-dashboard-export', {id: params.dashboard.id, type: params.exportType});

        return this.DataProvider.post('export/dashboardCSV', params).then((response) => {

            //receive launched export process id and save it in the local Map - this.exportCardsMap
            this.exportCardsMap.get(fakeDashboardId).processExportReferenceId = response.exportRequestId;
            if (!this.cardExportInProgress) this.checkIfCardExportProcessesFinished(fakeDashboardId);

        }).catch(() => {

            this.exportCardsMap.delete(fakeDashboardId);
            this.$rootScope.$emit('card.exportProcessEnd', {cardId: fakeDashboardId});
            if (!this.cardExportInProgress) {
                this.$rootScope.$emit('card.exportEnd');
            }

            this.toaster.error('Card could not be exported');
        });
    }

    exportDashboardToExcel(params) {
        params.level = 'dashboard';
        
        let fakeDashboardId = params.dashboard.id + 'd';

        let fileName = this.formatFileName(params.dashboard.name);

        let exportReferences = {
            processExportReferenceId: null,
            fileName: fileName,
            timestamp: new Date().getTime()
        };
        this.exportCardsMap.set(fakeDashboardId, exportReferences);

        this.$rootScope.$emit('card.exportStart', {cardId: fakeDashboardId});

        this.AppEventsService.track('used-dashboard-export', {id: params.dashboard.id, type: params.exportType});
        
        return this.DataProvider.post('export/excel', params).then((response) => {
            //receive launched export process id and save it in the local Map - this.exportCardsMap
            this.exportCardsMap.get(fakeDashboardId).processExportReferenceId = response.exportRequestId;
            if (!this.cardExportInProgress) this.checkIfCardExportProcessesFinished(fakeDashboardId, params.exportType);
        }).catch(() => {
            this.exportCardsMap.delete(fakeDashboardId);
            this.$rootScope.$emit('card.exportProcessEnd', {cardId: fakeDashboardId});
            if (!this.cardExportInProgress) {
                this.$rootScope.$emit('card.exportEnd');
            }

            this.toaster.error('Card could not be exported');
        });
    }

    checkIfCardExportProcessesFinished(dashboardId = undefined, type) {
        let pullUrl = dashboardId ? 'export/pullDashboardCSV' : 'export/pullCardCSV';
        
        if(type === 'excel') pullUrl = 'export/pullExcel';
        
        // In the loop 2 sec. check statuses on the server of all launched export processes (FE information about them is saved in Map - this.exportCardsMap).
        // If file ready we save file on disk and delete information about that card from the this.exportCardsMap.
        // Loop will be finished when this.exportCardsMap become empty.
        if (this.cardExportInProgress) return;

        let interval = this.watchers.interval(() => {
            this.allPromisesResolved && checkExportStatus();
        }, 2000);

        this.cardExportInProgress = true;

        var checkExportStatus = () => {

            //iterate over all launched export processes and check their statuses
            this.allPromisesResolved = false;
            let promiseArray = [];

            for (let cardId of this.exportCardsMap.keys()) {

                let value = this.exportCardsMap.get(cardId);
                let exportProcessId = value.processExportReferenceId;

                // stop waiting for the export result if there is more than 10 min from the moment of the export request
                if (new Date().getTime() - value.timestamp > 600000) {

                    this.exportCardsMap.delete(cardId);
                    this.$rootScope.$emit('card.exportProcessEnd', {cardId: cardId});
                    continue;
                }
    
                let params = {exportRequestId: exportProcessId, type: type};
                
                let promise = this.DataProvider.isExportedFileReady(pullUrl, params, undefined, undefined, dashboardId).then((fileReceived) => {
                    if (fileReceived) {
                        this.exportCardsMap.delete(cardId);
                        this.$rootScope.$emit('card.exportProcessEnd', {cardId: cardId});
                    }
                }).catch(() => {
                    this.exportCardsMap.delete(cardId);
                    this.$rootScope.$emit('card.exportProcessEnd', {cardId: cardId});
                    this.toaster.error('Card could not be exported');
                });

                promiseArray.push(promise);
            }

            this.$q.all(promiseArray).then(()=> {
                //check if any launched export process left
                if (this.exportCardsMap.size === 0) {
                    //all launched export processes finished
                    this.cardExportInProgress = false;
                    this.$rootScope.$emit('card.exportEnd');
                    this.watchers.cancelInterval(interval);
                }

                this.allPromisesResolved = true;
            });
        };
    }

    isExportProcessAlreadyLaunched(cardId) {
        return this.exportCardsMap.has(cardId);
    }
    
    exportSqlMetric(metric, format = 'sql'){
        this.$rootScope.$emit('metric.exportStart');

        var fileName = this.formatFileName(metric.getName());

        return this.DataProvider.saveFile('export/exportData', {metric: {id: metric.id}, format}, fileName).catch(() => {
            this.toaster.error('Metric could not be exported');
        }).finally(() => {
            this.$rootScope.$emit('metric.exportEnd');
        });
    }

    exportDashboard(params){
        let url = `export/dashboardPDF/${params.dashboard.id}`;
        let name = 'dashboard-' + params.dashboard.name;

        this.$rootScope.$emit('dashboard.exportStart');

        this.AppEventsService.track('used-dashboard-export', {id: params.dashboard.id, type: params.exportType});

        this.DataProvider.saveFile(url, params, name).catch(() => {
            this.toaster.error('Dashboard could not be exported');
        }).finally(() => {
            this.$rootScope.$emit('dashboard.exportEnd');
        });
    }

    exportDashboardToPowerpoint(params) {
        let url = `export/dashboardPresentation/${params.dashboard.id}`;
        let name = 'dashboard-' + params.dashboard.name;

        this.$rootScope.$emit('dashboard.exportStart');

        this.AppEventsService.track('used-dashboard-export', {id: params.dashboard.id, type: params.exportType});
    
        this.DataProvider.saveFile(url, params, name).catch(() => {
            this.toaster.error('Dashboard could not be exported');
        }).finally(() => {
            this.$rootScope.$emit('dashboard.exportEnd');
        });
    }

}

truedashApp.service('DataExportService', DataExportService);
