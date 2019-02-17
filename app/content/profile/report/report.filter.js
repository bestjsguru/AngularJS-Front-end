'use strict';

truedashApp.filter('reportFilter', () => {
    return (entries, keyword) => {
        if(entries && keyword) {
            let search = keyword.toLowerCase();
            entries = entries.filter((entry) => {
                const ownerUsername = entry.owner.username ? entry.owner.username : '';
                return !!(ownerUsername.toLowerCase().indexOf(search) != -1
                || entry.owner.fullName.toLowerCase().indexOf(search) != -1
                || (entry.dashboard && entry.dashboard.name.toLowerCase().indexOf(search) != -1));
            });
        }
    
        // User can access only reports that are linked to dashboards he has access to
        // In case user does not have access this property will not exist
        return entries.filter(report => report.dashboard);
    };
});
