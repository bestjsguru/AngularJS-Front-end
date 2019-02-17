'use strict';

import {Collection} from '../../data/collection.js';

class DashboardFolderCollection extends Collection {
    constructor() {
        super();
    }

    add(folder) {
        if (this.getById(folder.id)) return;
        this.addItem(folder);
    }

    remove(folder) {
        this.removeItem(folder);
    }

    getDefaultDashboard() {
        var folder = this.find(folder => folder.active && folder.activeDashboards.length);
        return folder ? folder.activeDashboards[0] : null;
    }

    sort() {
        //put organisation folders first then sort by position
        this.items.sort((a, b) => {
            if (a.organisation && b.organisation || !a.organisation && !b.organisation) return a.position - b.position;
            if (a.organisation && !b.organisation) return -1;
            return 1;
        });
    }
}

truedashApp.value('DashboardFolderCollection', DashboardFolderCollection);
