'use strict';

import {Config} from '../config.js';

const MAX_CONCURRENT_REQUESTS = 35;

class RequestKeyGenerator {
    static generate(url, options, params){
        let cacheUrlParams = options.cacheUrlParams !== undefined ? options.cacheUrlParams : true;
        let wholeUrl = _.isEmpty(params) ? url : url + '?' + $.param(params);

        return {
            get requestKey(){
                return 'GET' + wholeUrl;
            } ,
            get cacheKey(){
                return cacheUrlParams ? this.requestKey : 'GET' + url;
            }
        };
    }
}

class DataProvider {
    constructor(CacheService, $http, $q) {
        this.$q = $q;
        /** @type {CacheService} **/
        this.CacheService = CacheService;
        this.$http = $http;

        this.HIGH_PRIORITY = 1;
        this.LOW_PRIORITY = 2;
        this.caching = true;
        this.requestMap = {};
        this.queue = [];
        this.activeRequests = 0;
        this.isFake = false;
    }
    
    setAuthToken(token) {
        this.$http.defaults.headers.common['Authorization'] = token ? 'Bearer ' + token : undefined;
    }

    putToQueue(request, priority) {

        if (this.requestMap[request.key]) return this.requestMap[request.key].def.promise;

        let def = this.$q.defer();
        
        if (priority == this.HIGH_PRIORITY) {
            this.queue.unshift(request);
        } else {
            this.queue.push(request);
        }

        request.def = def;

        this.requestMap[request.key] = request;
        this.processNextRequest();

        return def.promise;
    }
    
    fake(response = () => {}) {
        this.isFake = true;
        this.fakeResponse = response;
        
        return this;
    }
    
    randomDelay(times = [400, 500, 600, 300, 700]) {
        times = _.isArray(times) ? times : [times];
        
        return this.$q((resolve) => {
            return setTimeout(() => {
                resolve(this.fakeResponse());
            }, times[Math.floor(Math.random() * times.length)]);
        });
    }

    processNextRequest() {
        if (!this.queue.length || this.activeRequests >= MAX_CONCURRENT_REQUESTS) return;

        this.activeRequests++;
        let request = this.queue.shift();
        let promise;


        if (request.method == 'GET') {
            promise = this.$http.get(request.url, {
                params: request.params,
                headers: request.headers
            });
        } else if (request.method == 'DELETE') {
            promise = this.$http.delete(request.url, {
                params: request.params,
                headers: request.headers
            });
        } else {
            promise = this.$http.post(request.url, request.params, {
                headers: request.headers,
                responseType: request.responseType
            });
        }

        promise.then(response => {
            // Reject a promise in order to be able to catch this as an exception later
            if (response.data.isError) return request.def.reject(new Error(response.data.message ? response.data.message : response.data.isError));

            let res = request.rawResponse ? response : response.data;
            return request.def.resolve(res);
        }).catch((err) => {
            return request.def.reject(err);
        }).finally(() => {
            delete this.requestMap[request.key];
            this.activeRequests--;
            this.processNextRequest();
        });
    }

    /**
     *
     * @param options
     * @returns {Promise}
     */
    get(options) {
        if(this.isFake) {
            this.isFake = false;
            
            return this.randomDelay();
        }
        
        //temporary here, after refactoring that section could be removed and function params decomposition used
        if (!_.isObject(options)) {
            let args = Array.prototype.slice.call(arguments);

            options = {};
            options.url = args[0];
            options.params = args[1];
            options.useCache = args[2];
            options.headers = args[3];
            options.cacheUrlParams = args[4];
            options.putCache = args[5];
        }

        let params = options.params || {};
        let useCache = options.useCache !== undefined ? options.useCache : true;
        let headers = options.headers || {};
        let putCache = options.putCache || true;
        let p;

        let url = DataProvider._getApiUrl(options.url);
        let {requestKey, cacheKey} = RequestKeyGenerator.generate(url, options, params);

        //we set high priority for all new request as simples for of priority control.
        let priority = options.priority || this.HIGH_PRIORITY;
    
        let cachedValue = (this.caching && useCache) ? this.CacheService.get(cacheKey) : null;
        
        if (this.caching && useCache && cachedValue) {
            p = this.$q.when(cachedValue);
        } else {
            let request = {
                key: requestKey,
                headers,
                params,
                url,
                method: 'GET'
            };

            p = this.putToQueue(request, priority).then((res) => {
                try {
                    if (putCache) {
                        this.CacheService.put(cacheKey, res);
                    }
                } catch (e) {
                    console.log(e);
                    console.info('Local storage full, request not saved', url);
                    // TODO: handle full localstorage here.
                }
                return res;
            });
        }
        return p;
    }

    static _getApiUrl(url){
        return Config.baseUrl + url;
    }

    /**
     * @param url
     * @param params
     * @param headers
     * @returns {Promise}
     */
    post(url, params, headers) {
        if(this.isFake) {
            this.isFake = false;
        
            return this.randomDelay();
        }
        
        let wholeUrl = _.isEmpty(params) ? url : url + '?' + $.param(params);
        let requestKey = 'POST ' + wholeUrl;

        let request = {
            key: requestKey,
            method: 'POST',
            url: DataProvider._getApiUrl(url),
            params,
            headers
        };

        return this.putToQueue(request, this.HIGH_PRIORITY);
    }

    put(url, params, headers) {
        if(this.isFake) {
            this.isFake = false;
        
            return this.randomDelay();
        }
        
        let wholeUrl = _.isEmpty(params) ? url : url + '?' + $.param(params);
        let requestKey = 'PUT ' + wholeUrl;

        let request = {
            key: requestKey,
            method: 'PUT',
            url: DataProvider._getApiUrl(url),
            params,
            headers
        };

        return this.putToQueue(request, this.HIGH_PRIORITY);
    }

    delete(url, params, headers) {
        if(this.isFake) {
            this.isFake = false;
        
            return this.randomDelay();
        }
        
        let wholeUrl = _.isEmpty(params) ? url : url + '?' + $.param(params);
        let requestKey = 'DELETE ' + wholeUrl;

        let request = {
            key: requestKey,
            method: 'DELETE',
            url: DataProvider._getApiUrl(url),
            params,
            headers
        };

        return this.putToQueue(request, this.HIGH_PRIORITY);
    }

    postWithUpload(url, params, file) {
        params = params || {};
        params.file = file;
        return this.$http({
            method: 'POST',
            url: DataProvider._getApiUrl(url),
            headers: {'Content-Type': undefined},
            transformRequest: (data) => {
                let formData = new FormData();
                for (let prop in data) {
                    formData.append(prop, data[prop]);
                }
                return formData;
            },
            data: params
        }).then((response) => {
            let res = response.data;
            return res.success ? res : this.$q.reject(res.message);
        });
    }

    //send request on server to start export process
    //server responds with launched export process id
    exportFileRequest(url, params, name, headers) {
        let wholeUrl = _.isEmpty(params) ? url : url + '?' + $.param(params);
        let requestKey = 'POST ' + wholeUrl;

        let request = {
            key: requestKey,
            method: 'POST',
            url: DataProvider._getApiUrl(url),
            params,
            headers,
            rawResponse: true
        };

        return this.putToQueue(request, this.HIGH_PRIORITY).then((response) => {
            return response.data
        });
    }

    //check if the export process with current id was finished
    isExportedFileReady(url, params, name, headers, dashboardId = undefined) {
        let wholeUrl = _.isEmpty(params) ? url : url + '?' + $.param(params);
        let requestKey = 'GET ' + wholeUrl;

        let request = {
            key: requestKey,
            method: 'GET',
            url: DataProvider._getApiUrl(url),
            params,
            headers,
            responseType: 'blob',
            rawResponse: true
        };

        return this.putToQueue(request, this.HIGH_PRIORITY).then((response) => {
    
            if (!response.data.status) {
                // BE is returning {exportStatus: "notProcessed"} in case file is still processing
                
                return false; // file not ready yet
            }
            
            if (response.data.status !== 200) {
                // Reject as some sort of error happened
                return this.$q.reject('File could not be exported')
            }
    
            let url = `truedash/export/load${dashboardId ? 'Dashboard' : 'Card'}CSV`;
    
            if(params.type === 'excel') url = 'truedash/export/loadExcel';
            
            url = url + `?exportRequestId=${params.exportRequestId}`;
            
            if (dashboardId) {
                url = url + `&dashboardId=${dashboardId.replace('d', '')}`;
            }
            
            window.open(url, "_self");

            return true;
        });
    }

    saveFile(url, params, name, headers) {
        let wholeUrl = _.isEmpty(params) ? url : url + '?' + $.param(params);
        let requestKey = 'POST ' + wholeUrl;

        let request = {
            key: requestKey,
            method: 'POST',
            url: DataProvider._getApiUrl(url),
            params,
            headers,
            responseType: 'blob',
            rawResponse: true
        };

        return this.putToQueue(request, this.HIGH_PRIORITY).then((response) => {
            let a = document.createElement('a');
            a.href = window.URL.createObjectURL(response.data);
            let contentDisposition = response.headers('Content-Disposition');
            if (!contentDisposition) return; // happen when there is no data

            let ext = contentDisposition.slice(contentDisposition.lastIndexOf('.'));
            a.download = name + ext;
            a.style.display = 'none';
            document.body.appendChild(a);
            setTimeout(() => a.click(), 0);
            return response.data;
        });
    }

    clearCache(url, params, requestType) {
        let wholeUrl = _.isEmpty(params) ? url : url + '?' + $.param(params);
        this.CacheService.remove(requestType.toUpperCase() + DataProvider._getApiUrl(wholeUrl));
    }
    
    getCacheKeysByUrl(url, requestType) {
        return this.CacheService.keys().filter(key => {
            return key.startsWith(requestType.toUpperCase() + DataProvider._getApiUrl(url));
        });
    }

    clearUrlCache(url, requestType) {
        this.getCacheKeysByUrl(url, requestType).forEach(key => this.CacheService.remove(key));
    }

    putToCache(url, params, data = {}){
        if(_.isEmpty(data)){
            throw new Error('preload cache with empty data is not available');
        }

        url = DataProvider._getApiUrl(url);

        let {cacheKey} = RequestKeyGenerator.generate(url, {}, params);

        this.CacheService.put(cacheKey, data);
    }
}

truedashApp.service('DataProvider', DataProvider);
