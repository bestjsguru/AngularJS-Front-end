'use strict';

import {AutomationBuilderModalCtrl} from './automationBuilderModal.controller';

class AutomationBuilderCtrl {

    constructor($uibModal, $confirm, AutomationService, toaster) {
        this.items = [];
        this.loaded = false;
        this.toaster = toaster;
        this.$confirm = $confirm;
        this.$uibModal = $uibModal;
        this.AutomationService = AutomationService;

        this.AutomationService.load().then((items) => {
            this.loaded = true;
            this.items = items;
        });
    }

    openModal(automation) {

        // If there is already modal active we need to close it before opening new one
        this.modalInstance && this.modalInstance.dismiss();

        this.modalInstance = this.$uibModal.open({
            controller: AutomationBuilderModalCtrl,
            templateUrl: 'content/automationBuilder/automation/form.html',
            bindToController: true,
            controllerAs: 'abm',
            resolve: {automation: () => automation},
            size: 'md'
        });
    }

    remove(item) {
        let message = 'This action cannot be undone. Are you sure you want to proceed?';
        this.$confirm({text: message}).then(() => {
            this.AutomationService.remove(item).then((items) => {
                this.toaster.success('Automation deleted!!');
            });
        });
    }

    toggleStatus(item) {
        item.active = !item.active;
        this.AutomationService.update(item).then(() => {
            this.toaster.success('Automation updated!!');
        });
    }

}

truedashApp.component('tuAutomationBuilder', {
    controller: AutomationBuilderCtrl,
    templateUrl: 'content/automationBuilder/list.html'
});
