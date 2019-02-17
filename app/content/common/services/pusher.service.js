'use strict';

let Pusher = require('pusher-js');

import {Config} from '../../config.js';

class PusherService {
    constructor(NotificationMessage, CacheService) {
        this.NotificationMessage = NotificationMessage;
        this.CacheService = CacheService;
    }
    
    init(user) {
        if(Config.isDev && !Config.pusher.enableOnDev) return;
        
        if(user.id && user.token.value) {
            Pusher.logToConsole = Config.isDev && Config.pusher.debug;
            
            this.Pusher = new Pusher(Config.pusher.appId, {
                cluster: 'eu',
                encrypted: true,
                authEndpoint: `${Config.baseUrl}pusher/auth`,
                auth: {
                    headers: {
                        'Authorization': `Bearer ${user.token.value}`
                    }
                }
            });
            
            this.subscribeToAppUpdates();
            
            this.userChannel = this.subscribePrivate(`${user.organisation.id}-${user.id}`);
            this.organisationChannel = this.subscribePrivate(`${user.organisation.id}`);
        }
    }
    
    subscribe(channelName, eventName, callback) {
        if(!this.isInitiated()) return;
        
        let channel = this.Pusher.subscribe(this.addCurentServer(channelName));
        
        if(eventName) channel.bind(eventName, callback);
        
        return channel;
    }
    
    subscribePrivate(channelName, eventName, callback) {
        return this.subscribe('private-' + channelName, eventName, callback);
    }
    
    get user() {
        this.currentChannel = this.userChannel;
        
        return this;
    }
    
    get organisation() {
        this.currentChannel = this.organisationChannel;
        
        return this;
    }
    
    listenFor(eventName, callback) {
        if(!this.isInitiated()) return;
        
        if(!this.currentChannel) throw new Error('You should select a channel before listening for events.');
        
        this.currentChannel && this.currentChannel.bind(eventName, callback);
        
        this.currentChannel = null;
    }
    
    reset() {
        this.isInitiated() && this.Pusher.disconnect();
    }
    
    subscribeToAppUpdates() {
        return this.subscribe('application-updates', 'new-version', (data) => {
            let message = `A new version of AVORA is available. ` +
                          `You'll need to refresh your browser to see the changes.<br><br> ` +
                          `Would you like to do this now?`;
            
            this.NotificationMessage.info({
                title: data.title,
                text: message,
                buttons: [
                    {
                        text: 'Yes, reload page now',
                        action: () => {
                            this.CacheService.removeAll(false);
                            location.reload(true);
                        }
                    }
                ]
            }).white().show();
        });
    }
    
    addCurentServer(channelName) {
        return channelName + '-' + Config.currentServer;
    }
    
    isInitiated() {
        return this.Pusher;
    }
}

truedashApp.service('PusherService', PusherService);
