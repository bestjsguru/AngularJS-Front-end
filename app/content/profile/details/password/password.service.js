'use strict';

class PasswordService {
    constructor(DataProvider) {
        this.DataProvider = DataProvider;
    }
    
    change(params) {
        return this.DataProvider.post('user/resetPassword', params);
    }
}

truedashApp.service('PasswordService', PasswordService);
