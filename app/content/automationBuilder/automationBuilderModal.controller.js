import {FrequencyParams} from '../common/frequencyParams';
import {AutomationParams} from './automation/automationParams';
import {FrequencyData} from '../common/frequencyData';

export class AutomationBuilderModalCtrl {
    constructor(automation, $q, $scope, $uibModalInstance, AutomationService, toaster, Auth, DashboardCollection, DashboardFolderService) {
        this.$q = $q;
        this.Auth = Auth;
        this.$scope = $scope;
        this.automation = automation || AutomationService.create();
        this.toaster = toaster;
        this.$uibModalInstance = $uibModalInstance;
        this.AutomationService = AutomationService;
        this.DashboardCollection = DashboardCollection;
        this.DashboardFolderService = DashboardFolderService;

        this.title = this.automation.id ? 'Update Automation' : 'Add New Automation';
        this.frequencies = FrequencyParams.getAllFrequencies();
        this.customFrequencies = FrequencyParams.getFrequencies();

        this.loading = false;

        this.data = {
            name: '',
            folders: [],
            dashboards: [],
            cards: [],
            protocols: AutomationParams.getProtocols()
        };

        this.populateData(this.automation);
        this.setName();
        this.setProtocol();
        this.initiateFoldersDashboardsAndCards().then(() => this.setFolderDashboardAndCard());
    }

    initiateFoldersDashboardsAndCards() {
        this.loading = true;

        this.DashboardCollection.firstLoad = false;
        var promises = [this.DashboardFolderService.load(), this.DashboardCollection.load()];

        return this.$q.all(promises).then(([folders, dashboards]) => {
            this.$q.when(this.DashboardFolderService.mergeFoldersAndDashboards()).then(() => {
                this.data.dashboards = this.getSingleDashboards();
                this.data.folders = _.clone(folders.items);

                this.loading = false;
            });
        });
    }

    getSingleDashboards() {
        return this.DashboardCollection.items.filter(dashboard => !dashboard.inFolder);
    }

    setFolderDashboardAndCard() {
        if (!this.automation.id || !this.automation.card.id) return;

        this.data.folders.forEach(folder => {
            folder.dashboards.forEach(item => {
                var dashboard = this.DashboardCollection.getById(item.id);
                if(!dashboard) return;

                var card = dashboard.cards.find(item => item.id == this.automation.card.id);
                if(!card) return;

                this.data.folders.selected = folder;
                this.$q.when(this.onFolderChange()).then(() => {
                    this.data.dashboards.selected = dashboard;

                    return this.$q.when(this.onDashboardChange()).then(() => {
                        this.data.cards.selected = card;
                    });
                });
            });
        });
    }

    setProtocol() {
        if (!this.automation.id || !this.automation.protocol) return;

        this.data.protocols.selected = AutomationParams.getProtocol(this.automation.protocol);
    }

    setName() {
        if (!this.automation.id || !this.automation.name) return;

        this.data.name = this.automation.name;
    }

    save() {
        // Don't submit if form is invalid
        if(this.form.$invalid) return;

        var promise;
        var automation = this.getAutomationData();

        if (automation.id) {
            // Update automation
            promise = this.AutomationService.update(automation).then(() => {
                this.toaster.success('Automation successfully updated');
            });
        } else {
            // Create new automation
            promise = this.AutomationService.add(automation).then(() => {
                this.toaster.success('Automation successfully created');
            });
        }

        promise.catch((error) => {
            this.toaster.error(error);
        }).finally(() => {
            this.$uibModalInstance.dismiss();
        });
    }

    getAutomationData() {
        // Clone current automation in order to keep current automation clean in case of failure
        // This way we will only update it in the list if request is successfully finished
        var automation = this.AutomationService.create(this.automation);

        automation.update(FrequencyData.forAutomationBuilder(this.selected));

        automation.name = this.data.name;
        automation.setCard(this.data.cards.selected);
        automation.protocol = this.data.protocols.selected.value;

        return automation;
    }

    populateData(automation) {
        this.selected = {
            alertFrequency: this.frequencies[1], // Set Daily as default
            customAlertFrequency: this.frequencies[1], // Set Daily as default
            customInterval: 1,
            frequencies: this.frequencies,
            customFrequencies: this.customFrequencies
        };

        if (automation.id) {
            this.selected.alertFrequency = this.frequencies.filter(frequency => frequency.value == automation.alertFrequency.value)[0];
            this.selected.customAlertFrequency = this.customFrequencies.filter(
                frequency => frequency.value == automation.alertFrequency.value)[0];
            this.selected.customInterval = automation.customInterval;
            this.selected.dateTime = automation.dateTime;
        }
    }

    onFolderChange() {
        this.data.cards = [];
        this.data.dashboards = this.DashboardCollection.items.filter((dashboard) => {
            return this.data.folders.selected.dashboards.find((item) => item.id == dashboard.id);
        });

        return this.data.dashboards;
    }

    onDashboardChange() {
        this.data.cards = this.data.dashboards.selected.cards.items;

        return this.data.cards;
    }

    foldersPlaceholder() {
        if(this.loading) return 'Loading...';
        if(!this.data.folders.length) return 'No folders';

        return 'Select folder';
    }

    dashboardsPlaceholder() {
        if(this.loading) return 'Loading...';
        if(!this.data.dashboards.length) return 'No dashboards';

        return 'Select dashboard';
    }

    cardsPlaceholder() {
        if(this.loading) return 'Loading...';
        if(!this.data.dashboards.selected) return 'Select dashboard first';
        if(!this.data.cards.length) return 'No cards';

        return 'Select card';
    }
}
