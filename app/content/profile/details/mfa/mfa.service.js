'use strict';

class MfaService {
    constructor(DataProvider, Auth) {
        this.Auth = Auth;
        this.DataProvider = DataProvider;
    }
    
    setMfa(status = true) {
        return this.DataProvider.get('user/setMfa', {status}, false).then(response => {
            this.Auth.user.mfaToken = status;
            this.Auth.trigger('updated');
            
            return response.enrollments || [];
        });
    }
    
    getEnrollments() {
        return this.DataProvider.get('user/mfaEnrollments', {}, false).then(response => {
            return response.enrollments || [];
        });
    }
    
    deleteEnrollment(enrollmentId) {
        return this.DataProvider.get('user/deleteMfaEnrollment', {enrollmentId}, false);
    }
}

truedashApp.service('MfaService', MfaService);
