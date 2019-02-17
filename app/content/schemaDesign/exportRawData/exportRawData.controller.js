"use strict";

import {SimpleTableModel} from '../../common/simpleTable.model';

export class ExportRawDataController {

    constructor(DataProvider, table, toaster) {
        /** @type {DataProvider} **/
        this.DataProvider = DataProvider;
        /** @type {ToasterService} **/
        this.toaster = toaster;

        this.table = new SimpleTableModel();
        this.table.id = table;

        this.refresh();
    }

    refresh(){
        this.loading = true;
        this.getData()
            .then(data => {
                this.table.update(data);
            })
            .finally(() => {
                this.loading = false;
            });
    }

    getData(){
        return this.DataProvider
            .get({
                url: 'table/preview',
                params: {
                    tableId: this.table.id
                },
                useCache: false
            })
            .catch(() => {
                this.toaster.error('Data is unavailable');
                this.$dismiss();
            });
    }

    close() {
        this.$dismiss();
    }
}
