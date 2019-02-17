'use strict';

class DatabaseExplorerSqlHistoryCtrl {
    constructor(DeregisterService, $scope, CacheService, $rootScope) {
        this.watchers = DeregisterService.create($scope);
        this.CacheService = CacheService;
        this.$rootScope = $rootScope;
    }

    $onInit() {
        this.history = this.CacheService.getPermanent('sqlQuery.history', []);

        this.watchers.onRoot('sqlQuery.executed', (event, query) => {
            // put latest queries first and keep only last ten items
            !this.lastItemIs(query) && this.history.unshift(query);
            this.history = this.CacheService.putPermanent('sqlQuery.history', this.history.slice(0, 9));
        });
    }

    hasHistory() {
        return this.history.length;
    }

    limitQueryLength(query) {
        if(query.length > 40) {
            return query.substr(0, 40) + '...';
        }

        return query;
    }

    lastItemIs(query) {
        return this.history[0] === query;
    }

    select(query) {
        this.$rootScope.$broadcast('sqlQuery.history.selected', query);
    }
}

truedashApp.component('appDatabaseExplorerSqlHistory', {
    controller: DatabaseExplorerSqlHistoryCtrl,
    templateUrl: 'content/databaseExplorer/sql/history/databaseExplorerSqlHistory.html'
});
