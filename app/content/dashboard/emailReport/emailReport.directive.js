'use strict';

import {EmailReportFrequencies} from './emailReportFrequencies';
import {EmailReportSentenceGenerator} from './emailReportSentenceGenerator';

class EmailReportModalController {
    constructor(dashboard, report, $scope, $rootScope, $uibModalInstance, OrganisationService, DashboardCollection,
                AppEventsService, DashboardReportService, toaster, Auth, DeregisterService) {
        this.Auth = Auth;
        this.$scope = $scope;
        this.report = report;
        this.toaster = toaster;
        this.dashboard = dashboard;
        this.$rootScope = $rootScope;
        this.AppEventsService = AppEventsService;
        this.$uibModalInstance = $uibModalInstance;
        this.DashboardCollection = DashboardCollection;
        this.OrganisationService = OrganisationService;
        this.DashboardReportService = DashboardReportService;
        
        this.watchers = DeregisterService.create($scope);

        this.title = this.report ? 'Update email report' : 'Create email report';
        this.tab = 'settings';

        this.user = this.Auth.user;
        this.users = [];
        this.frequencies = EmailReportFrequencies.all();
        this.snapshot = true;
        this.cards = [];
        this.selectedCards = [];
        
        if (this.report) {
            this.frequencies = this.frequencies.filter(f => f.value !== 'NOW');
        }

        this.customFrequencies = EmailReportFrequencies.custom();

        this.loadUsers();
        this.populateData(this.report);
    
        if (this.report) {
            this.dashboard.cards.loadCards().then(() => this.initiateCards());
        } else {
            this.watchers.watch('$ctrl.dashboard.loaded', loaded => loaded && this.initiateCards());
    
            if(this.dashboard.cards.loaded) {
                this.initiateCards();
            }
        }
        
        this.getShortName = EmailReportSentenceGenerator.shortName;

        this.AppEventsService.track('used-email-report');
    }
    
    initiateCards() {
        this.cards = this.getDashboardCards();
        this.selectedCards = this.getDashboardCards();
    
        if(this.report) {
            if(this.report.cardIds) {
                this.selectedCards = this.getDashboardCards().filter(card => this.report.cardIds.includes(card.id));
            } else if(this.report.card) {
                this.snapshot = false;
                this.selectedCards = this.getDashboardCards().filter(card => this.report.card === card.id);
            }
        }
    
        if(['csv', 'excel'].includes(this.selected.reportType)) {
            this.removeImageAndTextCards();
        }
    }
    
    removeImageAndTextCards() {
        this.cards = this.getDashboardCards().filter(card => {
            return !card.isImageOrDraft() && !card.isText();
        });
        this.selectedCards = this.getSelectedCards().filter(card => {
            return !card.isImageOrDraft() && !card.isText();
        }).slice();
    }
    
    getDashboardCards() {
        return this.dashboard.cards.items.filter(card => card.active).slice();
    }
    
    getSelectedCards() {
        return this.selectedCards || [];
    }
    
    allCardsSelected() {
        return this.cards.length === this.getSelectedCards().length;
    }
    
    changeType(type) {
        this.selected.reportType = type;
        this.cards = this.getDashboardCards();
        
        if(this.canUseSnapshot()) {
            this.snapshot = true;
            this.selectedCards = this.getDashboardCards();
        } else {
            this.snapshot = false;
    
            if(['csv', 'excel'].includes(this.selected.reportType)) {
                this.removeImageAndTextCards();
            }
        }
    }
    
    canUseSnapshot() {
        return ['pdf'].includes(this.selected.reportType);
    }
    
    canSelectCards() {
        return ['html', 'pdf', 'ppt', 'csv', 'excel'].includes(this.selected.reportType);
    }
    
    setSnapshot(value) {
        if(!this.canUseSnapshot()) return;
        
        this.snapshot = value;
        
        if(this.snapshot) {
            this.selectedCards = this.getDashboardCards();
        }
    }

    isCustom() {
        return this.selected.alertFrequency === EmailReportFrequencies.get('CUSTOM');
    }

    isNow() {
        return this.selected.alertFrequency === EmailReportFrequencies.get('NOW');
    }

    subscribe() {

        // Don't submit if form is invalid
        if(this.form.$invalid) return;

        let data = this.getData(this.selected);

        if (this.isNow()) {
            this.actionsForFrequencyNow(data);
            return;
        }
        
        let promise;

        if (this.report) {
            data.id = this.report.id;

            // Update report
            promise = this.DashboardReportService.update(data).then(() => {
                this.$rootScope.$broadcast('emailReport.updated', data);
                this.toaster.success('Email report has been updated.');
            });
        } else {
            // Create new report
            promise = this.DashboardReportService.save(data).then(() => {
                this.$rootScope.$broadcast('emailReport.created', data);
                this.toaster.success('Email report has been created.');
            });
        }

        promise.catch((error) => {
            console.warn(error);
            this.toaster.error('There was an error with your request. Please try again.');
        }).finally(() => {
            this.$uibModalInstance.dismiss();
        });
    }

    actionsForFrequencyNow(data) {
        if (data.reportType === 'LINK') {
            const model = {
                shareOwner: this.user.id,
                dashboard: data.dashboard,
                sharedTo: data.users
            };
            this.DashboardReportService.shareLinkNow(model);
        } else {
            this.DashboardReportService.createReportNow(data);
        }
        this.$uibModalInstance.dismiss();
    }

    getData(report) {
        return {
            alertFrequency: this.isCustom() ? report.customAlertFrequency.value.toUpperCase() : report.alertFrequency.value.toUpperCase(),
            reportType: report.reportType.toUpperCase(),
            dateTime: moment(report.dateTime).valueOf(),
            cardIds: this.allCardsSelected() ? null : this.getSelectedCards().map(card => card.id),
            snapshot: this.snapshot,
            dashboard: this.dashboard.id,
            createUserName: this.report ? this.report.owner.username : this.user.username,
            customInterval: this.isCustom() ? report.customInterval : 1,
            users: report.users.map(user => user.id),
            subject: report.subject,
            text: report.text
        };
    }

    populateData(report) {
        // Set default values
        this.selected = {
            alertFrequency: EmailReportFrequencies.get('DAILY'),
            customAlertFrequency: EmailReportFrequencies.get('DAILY'),
            customInterval: 1,
            reportType: 'pdf',
            subject: '',
            title: '',
            users: []
        };

        if (report) {
            let isCustomSelected = report.customInterval > 1;
            let customFrequency = EmailReportFrequencies.get('CUSTOM');
            let selectedFrequency = EmailReportFrequencies.get(report.alertFrequency.value);

            this.selected.alertFrequency = isCustomSelected ? customFrequency : selectedFrequency;
            this.selected.customAlertFrequency = selectedFrequency;
            this.selected.customInterval = report.customInterval;
            this.selected.reportType = report.reportType.toLowerCase();
            this.selected.dateTime = report.dateTime;
            this.selected.subject = report.subject;
            this.selected.title = report.title;
            this.selected.users = report.users;
            this.selected.text = report.text;
            
            this.snapshot = _.isBoolean(report.snapshot) ? report.snapshot : this.canUseSnapshot();
        }
    }

    getFrequencySentence() {
        let card = this.cards.selected || (this.report && this.report.card);
        let generator = new EmailReportSentenceGenerator(this.dashboard, card, this.selected);
        return generator.get();
    }

    loadUsers() {
        return this.OrganisationService.loadUsers().then(users => {
            if(!this.selected.users.length) {
                this.selected.users = [this.Auth.user];
            }
            this.users = users.filter(user => !user.isExternal());
        });
    }
}

class EmailReportController {
    constructor($uibModal) {
        this.$uibModal = $uibModal;
        this.modalInstance = null;
    }

    openModal(dashboard, report) {

        // If there is already modal active we need to close it before opening new one
        this.modalInstance && this.modalInstance.dismiss();

        this.modalInstance = this.$uibModal.open({
            controller: EmailReportModalController,
            templateUrl: 'content/dashboard/emailReport/emailReport.html',
            bindToController: true,
            controllerAs: 'erm',
            resolve: {
                dashboard: () => dashboard,
                report: () => report
            },
            size: 'md'
        });
    }
}

truedashApp.directive('tuEmailReport', () => ({
    controller: EmailReportController,
    bindToController: true,
    controllerAs: 'er',
    restrict: 'AE'
}));
