'use strict';

truedashApp.filter('customSearch', () => {
    return function(metrics, searchParam, metricName) {
        if(!metricName || !searchParam) return metrics;
        return metrics.filter(metric => {
            // support multiple search params
            var params = searchParam.split(','),
                found = false;
            params.forEach(param => {
                found = found || (metric[param.trim()] || '').toLowerCase().indexOf((metricName || '').toLowerCase()) > -1;
            });
            return found;
        });
    };
});

truedashApp.filter('searchByProperties', () => {
    return function(items, propertiesToSearch, searchString) {
        if(!searchString || !propertiesToSearch) return items;
        return items.filter(item => {
            // support multiple search params
            var params = propertiesToSearch.split(',');
            var found = false;

            params.forEach(param => {

                const searchStringInLowerCase = searchString ? searchString.toLowerCase() : "";

                const trimmedParam = param.trim();

                let itemByTrimmedParam = item[trimmedParam];
    
                // If it's a function we get the result from it
                if (typeof itemByTrimmedParam === "function") itemByTrimmedParam = item[trimmedParam]();
                
                // Errors in case when user invited but does not accept an invitation. Some fields of 'item' will be undefined
                if (itemByTrimmedParam) {
                    found = found || itemByTrimmedParam.toLowerCase().indexOf(searchStringInLowerCase) > -1;
                }
            });
            return found;
        });
    };
});
