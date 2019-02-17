'use strict';

class DeregisterService {
    constructor ($scope, $timeout, $interval, $rootScope) {
        this.$scope = $scope;
        this.$rootScope = $rootScope;
        this.$timeout = $timeout;
        this.$interval = $interval;
        this.watchers = [];
        this.timers = [];
        this.intervals = [];
        if ($scope) {
            $scope.$on('$destroy', this.destroyAll.bind(this));
        }
    }

    on(name, listener) {
        if (this.$scope) {
            return this.bindOn(this.$scope, name, listener);
        } else {
            console.warn('Scope not provided to deregister service');
        }
    }

    onRoot(name, listener) {
        return this.bindOn(this.$rootScope, name, listener);
    }

    // Should not be used from the outside, idea is that this is private
    bindOn(scope, name, listener) {
        let watcher, returnWatchers = [];

        // Convert single event bindings to array so we can handle it same way as multiple
        if(!Array.isArray(name)) {
            // With this we can now support this sintax for multiple events
            // watchers.on('event event2 event3', callbackFn);
            name = name.split(' ');
        }

        for(let i = 0; i < name.length; i++) {
            watcher = scope.$on(name[i], listener);
            this.watchers.push(watcher);
            returnWatchers.push(watcher);
        }

        // If it was single event, return only that watcher, otherwise return full array of watchers
        return returnWatchers.length === 1 ? returnWatchers[0] : returnWatchers;
    }

    watch(watchExpression, listener, objectEquality) {
        let watcher;
        if (this.$scope) {
            watcher = this.$scope.$watch(watchExpression, listener, objectEquality);
            this.watchers.push(watcher);
        }
        else console.warn('Scope not provided to deregister service');
        return watcher;
    }

    watchGroup(watchExpressions, listener) {
        let watcher;
        if (this.$scope) {
            watcher = this.$scope.$watchGroup(watchExpressions, listener);
            this.watchers.push(watcher);
        }
        else console.warn('Scope not provided to deregister service');
        return watcher;
    }

    watchCollection(obj, listener) {
        let watcher;
        if (this.$scope) {
            watcher = this.$scope.$watchCollection(obj, listener);
            this.watchers.push(watcher);
        }
        else console.warn('Scope not provided to deregister service');
        return watcher;
    }

    timeout(fn, time) {
        let timer = this.$timeout(fn, time);
        this.timers.push(timer);
        return timer;
    }

    interval(fn, period) {
        let timer = this.$interval(fn, period);
        this.intervals.push(timer);
        return timer;
    }

    addWatcher(watcher) {
        this.watchers.push(watcher);
    }

    addTimeout(timer) {
        this.timers.push(timer);
    }

    addInterval(interval) {
        this.timers.push(interval);
    }

    destroyAll() {
        this.watchers.forEach(watch => watch());
        this.timers.forEach(timer => this.$timeout.cancel(timer));
        this.intervals.forEach(timer => this.$interval.cancel(timer));
    }

    cancelTimeout(timeout) {
        if(!timeout) {
            // Cancel all timeouts
            this.timers.forEach(timer => this.$timeout.cancel(timer));
        }
        
        let idx = this.timers.indexOf(timeout);
        if (idx == -1) return;
        this.$timeout.cancel(timeout);
        this.timers.splice(idx, 1);
    }

    cancelInterval(interval) {
        let idx = this.intervals.indexOf(interval);
        if (idx == -1) return;
        this.$interval.cancel(interval);
        this.intervals.splice(idx, 1);
    }
}

// Used for storing watches so that they can be easily later destroyed in $destroy event
truedashApp.factory('DeregisterService', ($timeout, $interval, $rootScope) => {
    return {
        create: ($scope) => new DeregisterService($scope, $timeout, $interval, $rootScope)
    };
} );
