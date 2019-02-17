'use strict';

truedashApp.filter('alertFilter', () => {
    return (entries, keyword) => {
        if(!entries || !keyword) return entries;
        let search = keyword.toLowerCase();
        return entries.filter((entry) => {
            return entry.user.fullName.toLowerCase().includes(search) ||
                   entry.formatAlertHeading().toLowerCase().includes(search);
        });
    };
});
