'use strict';

import './apiai.factory';
import {Config} from './../../config';

class ApiaiService {
    constructor(DataProvider, $q, ApiaiFactory, $http, Auth) {
        this.$q = $q;
        this.$http = $http;
        this.Auth = Auth;
        this.ApiaiFactory = ApiaiFactory;
        this.DataProvider = DataProvider;
    
        if(this.tokens.developer) {
            this.api = window.axios.create({
                baseURL: 'https://api.api.ai/v1/',
                headers: {'Authorization': 'Bearer ' + this.tokens.developer}
            });
        }
        if(this.tokens.client) {
            this.client = new window.ApiAi.ApiAiClient({accessToken: this.tokens.client});
        }
    }
    
    get tokens() {
        return Config.apiai[this.Auth.user.organisation.id] || {};
    }
    
    send(message) {
        return this.client.textRequest(message).then((response) => {
            return this.ApiaiFactory.create(response);
        }).catch((error) => {
            console.log(error);
        });
    }
    
    getEntries() {
        return this.api.get('entities/Metric').then((response) => {
            return response.data.entries || [];
        });
    }
    
    saveEntries(entries) {
        return this.api.put('entities/Metric/entries', JSON.stringify(entries));
    }
    
}

truedashApp.service('ApiaiService', ApiaiService);
