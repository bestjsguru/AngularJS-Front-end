'use strict';

import {RoleService} from '../data/RolesHelper';
import {EventEmitter} from '../../system/events.js';
import {Config} from '../../config';

class FreshchatService extends EventEmitter {
    
    constructor(UserService) {
        super();
        this.UserService = UserService;
    }
    
    init(user) {
        return;
        
        if (Config.isDev) return;

        this.user = user;
        
        if (this.user.id && window.fcWidget) {
            window.fcWidget.init({
                token: "1cc55b22-505a-4475-8c06-1b03699e2bc8",
                host: "https://wchat.freshchat.com",
                externalId: this.user.username,
                restoreId: this.user.restoreId,
                config: {
                    headerProperty: {
                        hideChatButton: true
                    }
                }
            });
    
            this.initUser();
    
            this.createUser();
    
            this.trackUnreadCount();
        }
    }
    
    createUser() {
        // In order to retrieve past messages we need to have restore id for each user
        // When user first initiates chat we have to create user in freshchat in order to obtain restore id
        if(!this.user.restoreId) window.fcWidget.user.create();
    
        window.fcWidget.on('user:created', resp => {
            let status = resp && resp.status;
            let data = resp && resp.data;
            
            if(status === 200) {
                if(data.restoreId) {
                    // Update restoreId in your database
                    this.UserService.setRestoreId(data.restoreId);
                
                    window.Auth.user.restoreId = data.restoreId;
                    window.Auth.trigger('updated');
                }
            }
        });
    }
    
    initUser() {
        // To set unique user id in your system when it is available
        // window.fcWidget.setExternalId(user.username);
        window.fcWidget.user.setFirstName(this.user.firstName);
        window.fcWidget.user.setLastName(this.user.lastName);
        window.fcWidget.user.setEmail(this.user.email);
    
        // To set user properties
        window.fcWidget.user.setProperties({
            user_id: this.user.id,
            created_at: this.user.dateCreated,
            organisation: this.user.organisation.name,
            organisation_id: this.user.organisation.id,
            user_type: RoleService.getTitleById(this.user.role)
        });
    }
    
    trackUnreadCount() {
        this.unreadCount = 0;
    
        window.fcWidget.on("unreadCount:notify", (response) => {
            this.unreadCount = response.count;
            this.trigger('unreadCountChange', response.count);
        });
    }

    track(eventName, metadata = {}) {
        return;
        
        if (Config.isDev) return;
    
        this.isInitiated() && window.fcWidget.track(eventName, metadata);
    }

    open() {
        this.isInitiated() && window.fcWidget.open();
    }

    reset() {
        this.isInitiated() && window.fcWidget.destroy();
        
        delete window.fcWidget;
    }

    isInitiated() {
        return window.fcWidget && window.fcWidget.isInitialized();
    }
}

truedashApp.service('FreshchatService', FreshchatService);
