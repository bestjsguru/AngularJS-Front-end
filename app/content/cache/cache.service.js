'use strict';

let LZString = require('lz-string');

class CacheService {
    constructor(CacheFactory) {
        this.shouldCompress = true;

        this.cache = new CacheFactory('truedashCache', {
            storageMode: 'localStorage',
            deleteOnExpire: 'aggressive',
            cacheFlushInterval: 8 * 60 * 60 * 1000 // 8 hours
        });

        this.cachePermanent = new CacheFactory('truedashPermanentCache', {
            storageMode: 'localStorage'
        });
    }

    get(key, defaultValue) {
        return this.getCache(key, 'cache', defaultValue);
    }

    put(key, value) {
        return this.putCache(key, value, 'cache');
    }

    getPermanent(key, defaultValue) {
        return this.getCache(key, 'cachePermanent', defaultValue);
    }

    putPermanent(key, value) {
        return this.putCache(key, value, 'cachePermanent');
    }

    getCache(key, type, defaultValue) {
        let value;
        let cachedValue = this[type].get(key);

        try {
            if (cachedValue) value = JSON.parse(this.shouldCompress ? LZString.decompressFromUTF16(cachedValue) : cachedValue);
        } catch (e) {
            console.info('There was some problem when retrieving ' + type + ' key', e);
            console.info('Key value was: ' + key);
        }

        return !_.isUndefined(value) ? value : defaultValue;
    }

    putCache(key, value, type) {
        let stringValue = JSON.stringify(value);
    
        // return cache capacity to default value
        this[type].setCapacity(Number.MAX_VALUE);
        
        try {
            this[type].put(key, this.shouldCompress ? LZString.compressToUTF16(stringValue) : stringValue);
        } catch (e) {
            // Remove Least Recently Used item by changing cache capacity
            this[type].setCapacity(this[type].keys().length - 1);
            return this.putCache(key, value, type);
        }
    
        return value;
    }

    keys() {
        return this.cache.keys();
    }

    remove(key) {
        return this.cache.remove(key);
    }

    removeAll(withPermanent = true) {
        // User object is set to be permanent so we dont have to worry about accidentaly expiring auth tokens
        // This way user cache is only removed on logout or if user data is updated. Auth tokens are
        // checked on BE and if expired it will trigger loggout and clear user cache object
        withPermanent && this.removePermanent('user');

        return this.cache.removeAll();
    }

    removePermanent(key) {
        return this.cachePermanent.remove(key);
    }

    removeAllPermanent() {
        return this.cachePermanent.removeAll();
    }
}

truedashApp.service('CacheService', CacheService);
