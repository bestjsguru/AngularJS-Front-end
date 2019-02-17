'use strict';

import '../feedLog/feedLog.component';
import './feeds.service';
import {SubscriptionModel} from './subscription.model';

class FeedsCtrl {

    constructor($uibModal, FeedsService, $state, $scope, DeregisterService, AppEventsService) {
        this.$state = $state;
        this.$uibModal = $uibModal;
        this.FeedsService = FeedsService;
        this.AppEventsService = AppEventsService;

        this.watchers = DeregisterService.create($scope);
        
        this.feeds = [];
        this.subscriptions = {};
        this.feedsPerPage = 50;
    }
    
    $onInit() {
        this.loadFeeds().then(() => {
            this.loadSubscriptions();
            this.initAvailableStatuses();
    
            this.AppEventsService.track('data-feeds-page');
        });
    }
    
    initAvailableStatuses() {
        this.statuses = this.allFeeds.reduce((feeds, group) => {
            return [...feeds, ...group.feeds];
        }, []).reduce((statuses, feed) => {
            if(!statuses.find(status => status.name === feed.lastRunStatus)) {
                statuses.push({
                    name: feed.lastRunStatus,
                    checked: false,
                });
            }
        
            return statuses;
        }, []);
    }
    
    loadFeeds(useCache = true) {
        this.feeds = [];
        this.error = false;
        this.loading = true;
        
        return this.FeedsService.getList(useCache).then(list => {
            list.sort((a, b) => {
                if(a.unknown) return -1;
                if(b.unknown) return 1;
                return a.name.localeCompare(b.name);
            });
            this.allFeeds = _.cloneDeep(list);
            this.filteredFeeds = _.cloneDeep(list);
            this.feeds = list.map(item => {
                item.feeds = item.feeds.slice(0, this.feedsPerPage);
                
                return item;
            });
        }).catch((error) => {
            this.error = true;
            this.message = error.message;
        }).finally(() => {
            this.loading = false;
        });
    }
    
    showLog(feed) {
        feed.isError && this.$uibModal.open({
            size: 'md',
            component: 'appFeedLog',
            resolve: {
                feed: () => feed,
            }
        });
    }
    
    toggleAllFeeds() {
        let shouldOpen = this.allFeedsCollapsed() ? true : false;
        
        this.feeds.forEach(item => item.isOpen = shouldOpen);
    }
    
    allFeedsCollapsed() {
        return this.feeds.filter(item => item.isOpen).length === 0;
    }
    
    getFilteredFeed(item) {
        return this.filteredFeeds.find(feed => feed.name === item.name);
    }
    
    countFeeds(item) {
        return this.getFilteredFeed(item).feeds.length;
    }
    
    countErrorFeeds(item) {
        return this.getFilteredFeed(item).alerts.length;
    }
    
    hasMore(item) {
        return this.getFilteredFeed(item).feeds.length > item.feeds.length;
    }
    
    showMore(item) {
        item.feeds = [...item.feeds, ...this.getFilteredFeed(item).feeds.slice(item.feeds.length, item.feeds.length + this.feedsPerPage)];
    }
    
    clear() {
        this.query = '';
    
        this.filter();
    }
    
    filterByStatus(status) {
        status.checked = !status.checked;
    
        this.filter();
    }
    
    filter() {
        let query = _.clone(this.query) || '';
        let selectedStatuses = this.statuses.filter(status => status.checked);
        
        if(!query && !selectedStatuses.length) this.loadFeeds();
    
        this.filteredFeeds = _.cloneDeep(this.allFeeds).map(item => {
            if(selectedStatuses.length) {
                item.isOpen = true;
                
                item.feeds = item.feeds.filter(feed => {
                    return selectedStatuses.find(status => status.name === feed.lastRunStatus);
                });
            }
        
            return item;
        }).filter(item => item.feeds.length);
        
        if(query.length >= 2) {
            this.filteredFeeds = this.filteredFeeds.map(item => {
                item.isOpen = true;
        
                if(!this.compareWithSearchQuery(item.name)) {
                    item.feeds = item.feeds.filter(feed => {
                        return this.compareWithSearchQuery(feed.name) || this.compareWithSearchQuery(feed.tableName);
                    });
                }
        
                return item;
            }).filter(item => item.feeds.length);
        }
    
        this.feeds = _.cloneDeep(this.filteredFeeds).map(item => {
            item.feeds = item.feeds.slice(0, this.feedsPerPage);
        
            return item;
        });
    }
    
    compareWithSearchQuery(value) {
        let query = (this.query || '').replaceAll(['.', '_'], ' ').toLowerCase();
        
        return (value || '').replaceAll(['.', '_'], ' ').toLowerCase().includes(query);
    }
    
    loadSubscriptions() {
        this.FeedsService.getSubscriptions(false).then(items => {
            items.forEach(item => {
                this.subscriptions[item.jobName + item.datasourceName + item.feedName] = item;
            });
        });
    }
    
    subscribe(feed, type, status) {
        let subscription = this.getFeedSubscription(feed);
    
        subscription[type] = _.isBoolean(status) ? status : !subscription[type];
    
        feed.error = false;
        feed.loading = true;
        
        this.FeedsService.subscribe(subscription).then(() => {
            feed.loading = false;
            this.subscriptions[subscription.getKey()] = subscription;
        }).catch(() => {
            feed.loading = false;
            feed.error = true;
    
            this.watchers.timeout(() => feed.error = false, 1000);
        });
    }
    
    getFeedSubscription(feed) {
        let subscription = _.clone(this.subscriptions[feed.getKey()]);
        
        if(!subscription) {
            subscription = new SubscriptionModel({
                feedName: feed.name,
                jobName: feed.jobName,
                datasourceName: feed.datasourceName,
                email: false,
                app: false,
            });
        }
        
        return subscription;
    }
    
    subscribed(feed, type) {
        let subscription = this.subscriptions[feed.getKey()] || {};
        
        return subscription[type];
    }
    
    allSubscribed(source, type) {
        let feeds = _.get(this.allFeeds.find(item => item.id === source.id), 'feeds', []);
        
        return feeds.length && feeds.every(feed => this.subscribed(feed, type));
    }
    
    partiallySubscribed(source, type) {
        if(this.allSubscribed(source, type)) return false;
        
        let feeds = _.get(this.allFeeds.find(item => item.id === source.id), 'feeds', []);
        
        return feeds.length && feeds.some(feed => this.subscribed(feed, type));
    }
    
    noneSubscribed(source, type) {
        let feeds = _.get(this.allFeeds.find(item => item.id === source.id), 'feeds', []);
    
        return feeds.every(feed => !this.subscribed(feed, type));
    }
    
    subscribeAll(source, type, $event) {
        $event.stopPropagation();
        $event.preventDefault();
    
        source.error = false;
        source.loading = true;
        
        let feeds = _.get(this.filteredFeeds.find(item => item.id === source.id), 'feeds', []);
        let status = feeds.length && feeds.every(feed => this.subscribed(feed, type));

        let subscriptions = feeds.reduce((items, feed) => {
            let subscription = this.getFeedSubscription(feed);
    
            subscription[type] = !status;
    
            items.push(subscription);
    
            return items;
        }, []);

        return this.FeedsService.subscribe(subscriptions).then(() => {
            source.loading = false;
            subscriptions.forEach(subscription => {
                this.subscriptions[subscription.getKey()] = subscription;
            });
        }).catch((e) => {
            source.loading = false;
            source.error = true;
    
            console.log(e);
            
            this.watchers.timeout(() => source.error = false, 1000);
        });
    }
}

truedashApp.component('appFeeds', {
    controller: FeedsCtrl,
    templateUrl: 'content/dataQuality/feeds/feeds.html'
});

