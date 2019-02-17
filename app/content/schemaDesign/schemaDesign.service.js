"use strict";

import {ExportRawDataController} from './exportRawData/exportRawData.controller';

class SchemaDesignService {


    constructor($uibModal) {
        this.$uibModal = $uibModal;
    }

    openExportRawDataModal(table){
        this.$uibModal.open({
            controller: ExportRawDataController,
            templateUrl: 'content/schemaDesign/exportRawData/exportRawData.html',
            bindToController: true,
            controllerAs: 'export',
            size: 'lg',
            resolve: {
                table: () => table.id
            }
        });
    }
}

truedashApp.service('SchemaDesignService', SchemaDesignService);
