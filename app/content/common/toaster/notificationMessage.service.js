'use strict';

class NotificationMessageService {
    constructor(notify) {
        this.notify = notify;
        this.notify.config({
            duration: 0,
            position: 'right'
        });
    }

    /**
     * Show permanent message that will only close on 'x' button
     */
    show() {
        this.config.duration = 0;
        this.config.message.closeOnClick = false;
        this.config.message.showCloseButton = true;
        this.notify(this.config);
    }

    /**
     * Show flash message that will autoclose after some time
     */
    flash() {
        this.config.duration = 8000;
        this.config.message.closeOnClick = true;
        this.config.message.showCloseButton = false;
        this.notify(this.config);
    }

    pop(type, message) {
        this.config = {
            classes: type,
            message: message,
            templateUrl: this.getTemplate(message.template)
        };

        return this;
    }

    white() {
        this.config.classes += ' white';

        return this;
    }

    info(message) {
        return this.pop('info', message);
    }

    error(message) {
        return this.pop('error', message);
    }

    success(message) {
        return this.pop('success', message);
    }

    warning(message) {
        return this.pop('warning', message);
    }

    closeAll() {
        this.notify.closeAll();
    }

    getTemplate(template) {
        if(!template) template = 'defaultTemplate';

        return 'content/common/toaster/' + template + '.html';
    }
}

truedashApp.service('NotificationMessage', NotificationMessageService);

