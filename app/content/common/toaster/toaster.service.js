'use strict';

/**
 * This is True Dash notification service. It used to be a temporary hack, but now we will
 * use this to wrap any possible notification library we want to use in our code.
 *
 * That way even if we replace library we don't have to change
 * a line of code on any other place other than this.
 */

class ToasterService {
    constructor(toastr, toastrConfig) {
        this.toastr = toastr;

        angular.extend(toastrConfig, {
            closeButton: true,
            positionClass: 'toast-bottom-left',
            newestOnTop: true,
            preventDuplicates: false
        });
    }

    pop(type, title, message, options = {}) {
        if(_.isFunction(this.toastr[type])) {
            this.toastr[type](message, title, options);
        }
    }

    error(msg, title = 'Error'){
        this.pop('error', title, msg);
    }

    success(msg, title = 'Success'){
        this.pop('success', title, msg);
    }

    info(msg, title = 'Info'){
        this.pop('info', title, msg);
    }

    warning(msg, title = 'Warning'){
        this.pop('warning', title, msg);
    }
}

truedashApp.service('toaster', ToasterService);

