'use strict';

import {Config} from '../config';

class FolderCacheHelperService {
    constructor(CacheService) {
        this.CacheService = CacheService;
        this.folderListKey = "GET" + Config.baseUrl + "dashboardCollection/findByUser";
    }

    getFolderList() {
        return this.CacheService.getCache(this.folderListKey, "cache");
    }

    setFolderList(value) {
        this.CacheService.put(this.folderListKey, value);
    }

    getFolder(id, folderList = this.getFolderList()) {
        let existingFolder;

        if (folderList) {
            existingFolder = folderList.find(item => item.id === id);
        }

        return {existingFolder, folderList};
    }

    add(folder) {
        let {folderList} = this.getFolder(folder.id);

        if (folderList) {
            folderList.push(folder);
            this.setFolderList(folderList);
        }
    }

    update(folder) {
        let {existingFolder, folderList} = this.getFolder(folder.id);

        if (existingFolder && folderList) {
            existingFolder = folder;
            this.setFolderList(folderList);
        }
    }

    remove(folder) {
        let {existingFolder, folderList} = this.getFolder(folder.id);

        if (existingFolder && folderList) {
            folderList = _.without(folderList, existingFolder);
            this.setFolderList(folderList);
        }
    }
}

truedashApp.service('FolderCacheHelperService', FolderCacheHelperService);
