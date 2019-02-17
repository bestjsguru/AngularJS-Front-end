'use strict';

class EnsureUniqueController {
    constructor(DataProvider, $q) {
        this.DataProvider = DataProvider;
        this.$q = $q;
    }

    $onInit() {
        this.setValidator();
    }

    setValidator() {
        this.ngModel.$asyncValidators.username = (modelValue, viewValue) => {
            let emails = modelValue.split(',').map(item => item.trim());
            let requests = [];
            emails.forEach(email => requests.push(this.DataProvider.get('customer/checkUsername', {'username': email}, false)))
            return this.$q.all(requests).then(response => {
                    if (response.some(res => res.available == false)) {
                        this.ngModel.$setValidity('tuEnsureUniqueUsernames', false);
                        return false;
                    }
                    this.ngModel.$setValidity('tuEnsureUniqueUsernames', true);
                    return true;
                }
            );
        };
    }

}

truedashApp.directive('tuEnsureUniqueUsernames', () => {
    return {
        controller: EnsureUniqueController,
        restrict: 'A',
        require: {
            ngModel: 'ngModel'
        },
        bindToController: true
    };
});

