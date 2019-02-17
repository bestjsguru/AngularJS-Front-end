'use strict';

import {Config} from '../../config';
import OrganisationTheme from './theme/organisationTheme.model';

export default class Organisation {
    constructor(data) {
        data = data || {};
        
        this.init(data);
    }

    init(data) {
        this.id = data.id;
        this.name = data.name;
        this.domain = data.domain;
        this.sunWeek = data.sunWeek;
        this.location = data.location;
        this.logo = data.logo || Config.organisation.defaultPhotoUrl;
        this.useRounding = data.useRounding || false;
        this.numberOfDecimals = _.isNumber(data.numberOfDecimals) ? data.numberOfDecimals : 2;
        this.startDayOfWeek = data.startDayOfWeek || (this.sunWeek ? 7 : 1);
        this.useStartDayOfWeek = true;
        this.defaultCardSize = data.defaultCardSize || 0;
        this.fiscalYearStart = data.fiscalYearStart || null;
        this.theme = new OrganisationTheme(data.themeSettings);
        
        this.salesforceId = data.salesforceId || null;
        
        this.embeddingEnabled = data.embeddingEnabled || false;
        this.embeddingSecret = '';
        this.embeddingSecretIsSet = data.embeddingSecret || false;
    }
    
    setLogo(url) {
        this.logo = url;
    }
    
    hasLogo() {
        return this.logo !== Config.organisation.defaultPhotoUrl;
    }
    
    setUsers(users) {
        this.users = users;
    }
 
    get decimalCount() {
        return this.useRounding ? 0 : 2;
    }
    
    get startDayName() {
        return moment().isoWeekday(this.startDayOfWeek).format('dddd');
    }
    
    get fiscalYearStarting() {
        return '1st of ' + moment().month(this.fiscalYearStart).format('MMM');
    }

    /**
     * Return all organisation data
     *
     * For now this is only used to stringify current organisation data in order to save it in local session
     */
    getData() {
        let data = {
            id: this.id,
            name: this.name,
            domain: this.domain,
            sunWeek: this.sunWeek,
            location: this.location,
            logo: this.logo,
            useRounding: this.useRounding,
            numberOfDecimals: this.numberOfDecimals,
            startDayOfWeek: this.startDayOfWeek,
            useStartDayOfWeek: this.useStartDayOfWeek,
            defaultCardSize: this.defaultCardSize,
            fiscalYearStart: this.fiscalYearStart,
            themeSettings: this.theme.getJson(),
            embeddingEnabled: this.embeddingEnabled,
            salesforceId: this.salesforceId,
        };
    
        if(this.embeddingSecret && _.isString(this.embeddingSecret)) {
            data.embeddingSecret = this.embeddingSecret;
        }
        
        return data;
    }

    reset() {
        this.init({});
    }
}
