'use strict';

import './dashboardFolder.model.js';
import './dashboardFolder.collection.js';
import {EventEmitter} from '../../system/events.js';

class DashboardFolderService extends EventEmitter {

    constructor(DataProvider, DashboardFolderModel, DashboardFolderCollection, UserService, Auth, DashboardCollection, AppEventsService,
                DashboardFactory, FolderCacheHelperService) {
        super();

        this.Auth = Auth;
        this.UserService = UserService;
        this.DataProvider = DataProvider;
        this.AppEventsService = AppEventsService;
        this.DashboardFactory = DashboardFactory;
        this.DashboardCollection = DashboardCollection;
        this.FolderCacheHelperService = FolderCacheHelperService;
        this.DashboardFolderModel = DashboardFolderModel;
        this.dashboardFolders = new DashboardFolderCollection();
    
        this.error = false;
        this.firstLoad = true;
        this.loadPromise = null;

        // Clear everything on logout
        Auth.on('logout', () => this.unload());
        this.DashboardCollection.on('removed', this.removeDashboardFromFolders, this);
        this.DashboardCollection.on('created cloned', response => this.addDashboardToFolder(response.dashboard, response.folderId));
    }

    addDashboardToFolder(dashboard, folderId) {
        let folder = this.dashboardFolders.getById(folderId);

        if (folder) {
            folder.dashboards.push(this.DashboardFactory.create(dashboard));
        }
    }

    create(data) {
        return new this.DashboardFolderModel(data, this.UserService, this.DashboardFactory, this.Auth);
    }

    load(useCache = true) {
        this.error = false;
        
        //we always do reload on first time loading since dashboards could change
        useCache = !this.firstLoad && useCache;
        this.firstLoad = false;
        if (this.loadPromise && useCache) return this.loadPromise;

        this.loadPromise = this.DataProvider.get('dashboardCollection/findByUser', {}, useCache).then((response) => {
            return this.addResponseDashboardFolders(response, true);
        }).catch(() => {
            this.loadPromise = null;
            this.error = true;
        });

        return this.loadPromise;
    }

    save(folder) {
        folder = this.create(folder);
        return this.DataProvider.post('dashboardCollection/create', folder.getRequestData(), false).then((response) => {
            if (!this.dashboardFolders.getById(folder.id)) {
                this.FolderCacheHelperService.add(response);
                this.dashboardFolders.add(this.create(response));
            }

            this.trigger('created', response);

            this.AppEventsService.track('created-folder', {id: response.id});

            return folder;
        });
    }

    update(folder, saveFields = []) {
        let params = folder.getRequestData(saveFields);
        return this.DataProvider.get('dashboardCollection/update/' + folder.id, params, false).then((response) => {

            // Update folder values in current session
            folder.update(params);
            this.trigger('updated', response);

            this.AppEventsService.track('updated-folder', {id: folder.id});

            return folder;
        });
    }

    delete(folder) {
        return this.DataProvider.get('dashboardCollection/delete/' + folder.id, {}, false).then((response) => {
            let existingFolder = this.dashboardFolders.getById(folder.id);

            if (existingFolder) {
                this.FolderCacheHelperService.remove(existingFolder);
                this.dashboardFolders.remove(existingFolder);
            }

            this.trigger('removed', folder.id);

            this.AppEventsService.track('deleted-folder', {id: folder.id});

            return response;
        });
    }

    addDashboard(folderId, dashboardId, options = {}) {
        let params = {id: folderId, dashboardId: dashboardId};
        if (options.active !== undefined) params.active = options.active;
        if (options.position !== undefined) params.position = options.position;

        return this.DataProvider.get('dashboardCollection/addDashboard', params, false).then((response) => {
            this.FolderCacheHelperService.update(response);
            this.DashboardCollection.trigger('updated');
            return response;
        });
    }

    updateDashboard(folderId, dashboardId, options = {}) {
        let params = {id: folderId, dashboardId: dashboardId};
        if (options.active !== undefined) params.active = options.active;
        if (options.position !== undefined) params.position = options.position;

        return this.DataProvider.get('dashboardCollection/updateDashboard', params, false).then((response) => {
            this.FolderCacheHelperService.update(response);
            this.DashboardCollection.trigger('updated');
            return response;
        });
    }

    removeDashboard(folderId, dashboardId) {
        let params = {id: folderId, dashboardId: dashboardId};

        return this.DataProvider.get('dashboardCollection/removeDashboard', params, false).then((response) => {
            this.FolderCacheHelperService.update(response);
            this.DashboardCollection.trigger('updated');
            return response;
        });
    }

    addResponseDashboardFolders(response, forceOverride = false) {
        if (!response.length) return this.dashboardFolders;

        // We reset list of folders of so requested
        if (forceOverride) this.dashboardFolders.clear();

        response.forEach((responseItem) => {
            this.dashboardFolders.add(this.create(responseItem));
        });

        this.dashboardFolders.sort();

        return this.dashboardFolders;
    }

    mergeFoldersAndDashboards() {
        // First mark all dashboards as if they don't belong to a folder
        this.DashboardCollection.items.map(dashboard => dashboard.inFolder = false);

        // And than we do the merging :)
        this.dashboardFolders.forEach(folder => {
            if (!folder.dashboards) return;
            folder.dashboards.forEach((dashboard) => {
                var foundDash = this.DashboardCollection.getById(dashboard.id);
                if (!foundDash) return;
                dashboard.name = foundDash.name;
                foundDash.inFolder = folder.id;
            });
        });

        return this.dashboardFolders;
    }

    removeDashboardFromFolders(dashboardId) {
        this.dashboardFolders.forEach(folder => {
            folder.dashboards && folder.removeDashById(dashboardId);
        });
    }

    unload() {
        this.firstLoad = true;
        this.loadPromise = null;
        this.dashboardFolders.clear();
    }

    invalidate() {
        this.firstLoad = true;
        this.loadPromise = null;
        this.DataProvider.clearCache('dashboardCollection/findByUser', {}, 'GET');
        this.DashboardCollection.invalidate();
    }
    
    limitFoldersPerUser(user, role, folders, groups, access){
        this.role = role;
    
        let params = {
            email: user.email,
            role: role.id,
            folders: folders.items.filter(folder => folder.selected).map(folder => folder.id),
            dashboards: folders.items.reduce((ids, folder) => {
                folder.dashboards.forEach(dashboard => {
                    dashboard.selected && ids.push(dashboard.id);
                });
        
                return ids;
            }, []),
            groups: groups,
        };
        
        if(access.forever) params.forever = access.forever;
        if(!access.forever && access.limit) params.limit = access.limit;
    
        return this.DataProvider.post('dashboardCollection/authUserDashboardCollection', params);
    }

    /**
     * @param {User} user
     * @returns {Promise}
     */
    getFolderStatusPerUser(user){
        return this.DataProvider.get('dashboardCollection/userPermissions/' + user.id, {}, false);
    }
}

truedashApp.service('DashboardFolderService', DashboardFolderService);
