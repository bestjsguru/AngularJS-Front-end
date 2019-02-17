'use strict';

export class AutomationParams {
    static getProtocols() {
        return [
            {value: 'FTP', label: 'FTP'},
            {value: 'SFTP', label: 'SFTP'},
            {value: 'EMAIL', label: 'Email'},
            {value: 'WEBHOOK', label: 'Webhook'}
        ];
    }

    static getProtocol(value) {
        return this.getProtocols().find(protocol => protocol.value === value);
    }
}
