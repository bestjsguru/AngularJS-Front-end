'use strict';

class ValidEmailDomainController {

    $onInit() {
        const EMAIL_REGEXP = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;

        this.ngModel.$validators.validEmailDomain = (modelValue, viewValue) => {

            let domain = modelValue || viewValue;

            if(!domain  || domain === '') {
                return true;
            }

            if(domain.startsWith('www.')){
                return false;
            }

            try {
                // Because we are testing email domain we will add missing email part to a domain and test it as full email
                let email = 'example@' + domain;

                return EMAIL_REGEXP.test(email.trim());

            } catch (e) {
                return false;
            }
        };
    }
}

truedashApp.directive('appValidEmailDomain', () => {
    return {
        controller: ValidEmailDomainController,
        restrict: 'A',
        require: {
            ngModel: 'ngModel'
        },
        bindToController: true
    };
});

