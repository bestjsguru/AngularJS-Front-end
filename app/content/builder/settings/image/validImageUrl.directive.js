'use strict';

class ValidImageUrlController {

    constructor($q) {
        this.$q = $q;
    }

    $onInit() {
        this.ngModel.$asyncValidators.validImageUrl = (modelValue, viewValue) => {
            let url = modelValue || viewValue;

            return this.$q(function (resolve, reject) {
                var timeout = 5000;
                var timer, img = new Image();
                img.onerror = img.onabort = function () {
                    clearTimeout(timer);
                    reject("error");
                };
                img.onload = function () {
                    clearTimeout(timer);
                    resolve("success");
                };
                timer = setTimeout(function () {
                    // reset .src to invalid URL so it stops previous
                    // loading, but doens't trigger new load
                    img.src = "//!!!!/noexist.jpg";
                    reject("timeout");
                }, timeout);
                img.src = url;
            }).then(() => {
                return true;
            }).catch(() => {
                return this.$q.reject('Invalid image url');
            });
        };
    }


}

truedashApp.directive('appValidImageUrl', () => {
    return {
        controller: ValidImageUrlController,
        restrict: 'A',
        require: {
            ngModel: 'ngModel'
        },
        bindToController: true
    };
});

