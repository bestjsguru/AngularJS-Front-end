'use strict';

import HighchartConfig from '../highchart/highchart.config';
import {Helpers} from '../../common/helpers';

export class AnnotationModel {
    constructor(data, $injector) {
        this.Auth = $injector.get('Auth');
        this.UserService = $injector.get('UserService');
        
        this.original = data || {};
        
        this.init(data);
    }
    
    init(data) {
        this.x = data.x;
        this.id = data.id;
        this.date = data.date;
        this.title = data.title;
        this.cardId = data.cardId;
        this.selected = data.selected || false;
    
        let category = parseInt(data.category);
        this.category = isNaN(category) ? data.category : category;
    
        this.owner = this.UserService.create(data.owner);
    }
    
    isNew() {
        return !this.id;
    }
    
    isSibling(item) {
        return this.x === item.x && this.category === item.category;
    }
    
    isSameAs(item) {
        return this.isSibling(item) && this.date === item.date;
    }
    
    isOwnedByCurrentUser() {
        if (!this.Auth.isLoggedIn()) return false;
        return this.owner.id === this.Auth.user.id;
    }
    
    get dateFromNow() {
        return moment(this.date).fromNow();
    }
    
    get dateTitle() {
        return HighchartConfig.date.format(this.date);
    }
    
    getJson() {
        let annotation = {
            x: this.x,
            date: this.date,
            title: this.title,
            cardId: this.cardId,
            category: this.category,
            owner: this.original.owner
        };
        
        // We do not have ID when creating annotations so we avoid sending it to server
        if(this.id) annotation.id = this.id;
        
        return annotation;
    }
    
    saveState() {
        this.state = this.getJson();
    }
    
    rollback() {
        if(!this.state) return;
        
        this.init(this.state);
        
        delete this.state;
        
        return this;
    }
}
