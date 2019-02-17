'use strict';

class OrganizeDashboardsController {

    constructor($scope, $rootScope, $confirm, DashboardFolderService, DeregisterService, toaster, AppEventsService,
                DashboardCollection, $q, Auth, CardCacheHelperService, UserService) {

        this.$q = $q;
        this.Auth = Auth;
        this.$scope = $scope;
        this.toaster = toaster;
        this.$confirm = $confirm;
        this.$rootScope = $rootScope;
        this.UserService = UserService;
        this.DashboardCollection = DashboardCollection;
        this.DashboardFolderService = DashboardFolderService;
        this.CardCacheHelperService = CardCacheHelperService;

        // Users and admins have different templates so we need to define them here
        this.template = 'organize-' + (this.Auth.user.isAdmin() ? 'admin' : 'user');

        this.loading = true;
        this.lockFolders = false;

        this.dashboards = undefined;
        this.organisation = { folders: [] };
        this.user = { folders: [] };
        this.folders = undefined;
        this.forms = [];

        this.watchers = DeregisterService.create(this.$scope);
    
        AppEventsService.track('viewed-organize-dashboards-page');
    }

    get title() {
        return window.Auth.user.organisation.name;
    }

    $onInit() {
        this.setupFolderSortable();
        this.setupDashboardSortable();

        this.initiateFolders();
        this.setupFolderForms();

        this.DashboardCollection.on('created', this.initiateFolders, this);
    }

    setupFolderForms() {
        this.create = {
            user: {
                form: {},
                visible: false,
                folder: this.DashboardFolderService.create(),
                show: () => {
                    this.create.user.visible = true;
                    this.create.user.folder.reset();
                },
                hide: () => {
                    this.create.user.form.$setPristine(true);
                    this.create.user.visible = false;
                    this.create.user.folder.reset();
                },
            },
            organisation: {
                form: {},
                visible: false,
                folder: this.DashboardFolderService.create(),
                show: () => {
                    this.create.organisation.visible = true;
                    this.create.organisation.folder.reset();
                    this.create.organisation.folder.organisation = this.Auth.user.organisation;
                },
                hide: () => {
                    this.create.organisation.form.$setPristine(true);
                    this.create.organisation.visible = false;
                    this.create.organisation.folder.reset();
                }
            }
        };
    }

    setupFolderSortable() {
        this.folderSortableOptions = {
            update: (e, ui) => {
                // on cross list sorting received is not true during the first update
                // which is fired on the source sortable
                if (!ui.item.sortable.received) {
                    var originNgModel = ui.item.sortable.sourceModel;
                    var item = originNgModel[ui.item.sortable.index];

                    if(ui.item.sortable.dropindex !== undefined) {
                        let updateFields = ['position'];
                        item.position = ui.item.sortable.dropindex + 1;

                        if(ui.item.sortable.droptarget[0].classList.contains('organisation-folders')) {
                            item.organisation = window.Auth.user.organisation.id;
                            item.users = [];
                            updateFields.push('organisation');
                        } else {
                            item.organisation = null;
                            item.users = [this.Auth.user];
                        }

                        this.edit(item, updateFields);
                    }
                }
            },
            connectWith: '.folders-sortable-list',
            handle: '.folder-name',
            items: '> div:not(.not-sortable)'
        };
    }

    setupDashboardSortable() {
        this.dashboardSortableOptions = {
            stop: this.onSortableStop.bind(this),
            update: function (e, ui) {
                ui.item.sortable.droptarget[0].classList.contains('not-sortable') && ui.item.sortable.cancel();
            },
            connectWith: '.dashboards-sortable-list',
            handle: '.dashboard-name',
            items: '> li:not(.not-sortable)'
        };
    }

    onSortableStop(e, ui) {

        if (!ui.item.sortable.droptarget) return;
        if (ui.item.sortable.droptarget[0].classList.contains('not-sortable')) {
            this.toaster.warning('You dont have permission to edit organisation workspaces');
            return;
        }

        let newFolderId = parseInt(ui.item.sortable.droptarget.attr('id'));
        let oldFolderId = parseInt(e.target.id);

        // We rearrange dashboard positions if they are dropped inside same folder
        if (newFolderId === oldFolderId || isNaN(newFolderId) && isNaN(oldFolderId)) {
            // Rearrange dashboards inside same folder
            !isNaN(newFolderId) && !isNaN(oldFolderId) && this.DashboardFolderService.updateDashboard(newFolderId,
                ui.item.sortable.model.id, {'position': ui.item.sortable.dropindex + 1}).then(() => {
                this.toaster.success('Dashboard position updated');
            });

            return;
        }

        if (isNaN(newFolderId)) {
            // Move dashboard outside of folders
            this.DashboardFolderService.removeDashboard(oldFolderId, ui.item.sortable.model.id).then(() => {
                this.toaster.success('Dashboard moved outside of workspaces');
            });
        } else {
            // If we are moving dashboard from outside of folder it doesn't have active property
            // at all in that case we are setting dashboard to be active by default
            if(ui.item.sortable.model.active === undefined) ui.item.sortable.model.active = true;

            const originalIndex = ui.item.sortable.index;
            const newIndex = ui.item.sortable.dropindex;
            const sourceModel = ui.item.sortable.sourceModel;
            const targetModel = ui.item.sortable.droptargetModel;
            const itemModel = ui.item.sortable.model;

            // Add dashboard to a folder
            let options = {'position': ui.item.sortable.dropindex + 1, 'active': ui.item.sortable.model.active};

            this.DashboardFolderService.addDashboard(newFolderId, ui.item.sortable.model.id, options).then(() => {
                this.loadOwnerDetails(this.folders.find(folder => folder.id === newFolderId).dashboards);
                this.toaster.success('Dashboard moved into a workspace');
            }).catch((message) => {
                this.toaster.error('Error adding dashboard', message);
                if (sourceModel !== targetModel) {
                    sourceModel.splice(originalIndex, 0, itemModel);
                    targetModel.splice(newIndex, 1);
                }
            });
        }
    }

    initiateFolders(useCache = true) {
        this.loading = true;

        var promises = [this.DashboardFolderService.load(useCache), this.DashboardCollection.load(useCache)];

        this.$q.all(promises).then(([foldersList, dashboardItems]) => {
            this.folders = foldersList;
            //todo: DashboardFolderService should use DashboardCollection directly
            this.dashboards = this.DashboardCollection.items;

            this.DashboardFolderService.mergeFoldersAndDashboards();

            // We now split organisation folders from user folders
            this.splitOrganisationAndUserFolders();

            // And remove dashboards that are already inside folders
            this.dashboards = this.withoutDashboardsThatAreInFolders(this.dashboards);

            this.loading = false;
        });
    }

    splitOrganisationAndUserFolders() {
        this.user.folders.length = 0;
        this.organisation.folders.length = 0;

        this.folders.forEach((folder) => {
            // by default we close all folders
            folder.dashboardsAreVisible = false;
            folder.isOrganisationFolder() ? this.organisation.folders.push(folder) : this.user.folders.push(folder);
        });
    }

    withoutDashboardsThatAreInFolders(dashboards) {
        return dashboards.filter(dashboard => !dashboard.inFolder);
    }

    loadOwnerDetails(dashboards) {
        dashboards.forEach(dashboard => {
            dashboard.owner = null;

            this.UserService.retreiveUserDetails(dashboard.createdBy).then((user) => {
                dashboard.owner = this.UserService.create(user);
            }).catch(angular.noop);
        });
    }

    toggleDashboards(folder) {
        folder.dashboardsAreVisible = folder.dashboardsAreVisible !== true;

        if(folder.dashboardsAreVisible) this.loadOwnerDetails(folder.dashboards);
    }

    dashboardsAreVisible(folder) {
        // Make dashboards visible by default
        if(folder.dashboardsAreVisible === undefined) folder.dashboardsAreVisible = true;
        return folder.dashboardsAreVisible;
    }

    hasVisibleDashboards(type) {
        // check if at least one dashboard folder is expanded / opened
        return this[type].folders.find(folder => folder.dashboardsAreVisible === true);
    }

    toggle(type) {
        // if there is at least one opened folder we will collapse - otherwise we expand
        let hasVisibleDashboards = this.hasVisibleDashboards(type);
        this[type].folders.map(folder => folder.dashboardsAreVisible = !hasVisibleDashboards);

        if(!hasVisibleDashboards) this[type].folders.forEach(folder => {
            this.loadOwnerDetails(folder.dashboards);
        });
    }

    save(createObject) {
        if(!createObject.form) return;

        let form = createObject.form;

        // Don't submit if form is invalid
        if(form.$invalid) return;

        this.lockFolders = true;

        this.DashboardFolderService.save(createObject.folder).then(() => {
            // Mark form as valid if name is unique
            if(form && form.title) form.title.$invalid = false;
            createObject.visible = false;
            createObject.folder.reset();
            this.splitOrganisationAndUserFolders();

            this.toaster.success('Dashboard workspace created');
            this.lockFolders = false;
        }).catch((message) => {
            // Name already exist, so user needs to change it
            // We display error under input field same style as normal validation
            if(form) {
                form.title.$invalid = true;
                form.title.$error.unique = message;
            } else {
                this.toaster.error(message);
            }
        });
    }

    edit(folder, saveFields = []) {
        if(!folder) return;

        // Don't submit if form is invalid
        let form = this.forms['folderForm' + (folder.id || 'New')];
        if(form && form.$invalid) return;

        this.lockFolders = true;

        this.DashboardFolderService.update(folder, saveFields).then(() => {

            // Mark form as valid if name is unique
            if(form && form.title) form.title.$invalid = false;

            // Only close edit mode if we have updated title
            if(!saveFields.length) folder.inEditMode = false;
            this.toaster.success('Dashboard workspace updated');

        }).catch((message) => {
            message.message = message.message || 'Something went wrong.';

            if(!form) return this.toaster.error(message.message);

            // Name already exist, so user needs to change it
            // We display error under input field same style as normal validation
            if (!form.title) {
                form.title = {$error: {'unique': null}};
            }
            form.title.$dirty = true;
            form.title.$invalid = true;
            form.title.$error.unique = message.message;

        }).finally(() => {
            this.lockFolders = false;
        });
    }

    delete(folder) {
        if(!folder) return;

        return this.$confirm({
            title: 'Delete Workspace',
            text: `Are you sure you want to delete <strong>${folder.title}</strong>? All dashboards from this workspace will be preserved.`,
            ok: 'Delete',
            cancel: 'Cancel'
        }).then(() => {
            this.DashboardFolderService.delete(folder).then(() => {
                if(folder.dashboards.length) {
                    folder.dashboards.forEach(item => this.dashboards.push(item));
                }
                this.splitOrganisationAndUserFolders();

                this.toaster.success('Dashboard workspace deleted');
            });
        });

    }

    deleteDashboard(dashboard) {
        if(!dashboard) return;

        return this.$confirm({
            title: 'Delete Dashboard',
            text: `Are you sure you want to delete <strong>${dashboard.name}</strong>?`,
            ok: 'Delete',
            cancel: 'Cancel'
        }).then(() => {
            this.loading = true;

            this.DashboardCollection.remove(dashboard).then(() => {
                this.watchers.timeout(() => this.initiateFolders(), 100);
                this.toaster.success('Dashboard deleted');
            }).catch(() => {
                this.toaster.error('There was an error while removing dashboard');
            });
        });

    }

    toggleActive(folder) {
        if(!folder) return;

        let updateFields = ['active'];
        folder.active = !folder.active;

        if(folder.isOrganisationFolder()) {
            folder.organisation = folder.organisation.id || folder.organisation;
            updateFields.push('organisation');
        }

        this.edit(folder, updateFields);
    }

    toggleDashboardActive(folder, dashboard) {
        if(!folder || !dashboard) return;

        dashboard.active = !dashboard.active;

        // Add dashboard to a folder
        this.DashboardFolderService.updateDashboard(folder.id, dashboard.id, {'active': dashboard.active}).then(() => {
            this.toaster.success('Dashboard ' + (dashboard.active ? 'activated' : 'deactivated'));
        });
    }

    folderCanBeDragged(folder) {
        if(this.lockFolders) return false;
        return !(folder.isOrganisationFolder() && !this.Auth.user.isAdmin());
    }

    folderCanBeChanged(folder) {
        return !(folder.isOrganisationFolder() && !this.Auth.user.isAdmin());
    }

    /**
     * Check if form field is dirty
     *
     * @param field
     * @returns boolean
     */
    dirty(field) {
        if (!field) {
            field = {$dirty: true};
        }
        return field.$dirty;
    }

    $onDestroy() {
        this.DashboardCollection.off(null, null, this);
    }
}

truedashApp.component('tuOrganizeDashboards', {
    controller: OrganizeDashboardsController,
    templateUrl: 'content/profile/dashboards/organize.html'
});
