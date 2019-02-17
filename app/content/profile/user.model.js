'use strict';

import {EventEmitter} from '../system/events.js';
import {Authorize} from '../common/authorize';
import {Config} from '../config';
import Organisation from './organisation/organisation.model';

// These users will have admin privileges even if they are not admins.
// It is useful for development process. Feel free to add your
// email for testing but don't add client emails here!!
const DEVELOPERS = [
    // 'nikola.pajic@gmail.com',
    // 'nikola.pajic+mv@gmail.com'
];

const DEMO = {
    ORGANISATIONS: [
        // 95
    ],
    USERS: [
        'alvin+ml@avora.com',
        'nikola+demoml@avora.com',
    ],
    EXCLUDED_USERS: [
        // 'alvin+demoml@avora.com'
    ],
};

export class User extends EventEmitter {
    constructor(data) {
        super();

        this.Authorize = new Authorize();

        data = data || {};

        this.init(data);
    }

    init(data) {
        this.id = data.id;
        this.firstName = data.firstName || '';
        this.lastName = data.lastName || '';
        this.fullName = this.getFullName();
        this.username = data.username || null;
        this.email = data.email || data.username;
        this.locale = data.locale;
        this.photo = data.photo || Config.user.defaultPhotoUrl;
        this.timezone = data.timezone || Config.timezone;
        this.token = {
            id: data.idToken || null,
            value: data.accessToken || null,
            expiresAt: data.expiresAt || null,
        };
        this.role = data.role || null;
        this.organisation = new Organisation(data.organisation);
        this.dateCreated = data.dateCreated;
        this.subscriptionId = data.subscriptionId;
        this.mfaToken = !! data.mfaToken;
        this.invitedBy = data.user;
        this.expired = data.expired;
        this.restoreId = data.restoreId || null; // Used for freshchat to get message history
        this.userService = !! data.userService;
        this.acceptedInvite = !! data.acceptedInvite;
        this.accountExpired = !! data.accountExpired;
        this.expirationDate = data.expirationDate;
        this.hasRefreshToken = !! data.hasRefreshToken;
        
        this.permissions = data.permissions || [];
    }

    reset() {
        this.init({});
    }

    /**
     * Return full user name with some return options
     *
     * @param capitalize        Capitalize first letters of first and last name
     * @param firstNameInitial  Return first name as initial (John becomes J.)
     * @returns {string}
     */
    getFullName(capitalize = false, firstNameInitial = false) {

        if(!this.firstName && !this.lastName) return '';

        let firstName = String(this.firstName);
        let lastName = String(this.lastName);

        if(capitalize) {
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
        }

        if(firstNameInitial) firstName = firstName.charAt(0) + '.';

        return (firstName + ' ' + lastName).trim(' ');
    }

    /**
     * Sometimes users don't have first and last name so we want to return email instead
     *
     * @returns {string}
     */
    get fullNameOrEmail() {
        return this.fullName || this.email;
    }
    
    get roleName(){
        const role = Config.user.roles.find(role => this.role === role.id) || {};
        
        return role.title || '';
    }

    /**
     * Return all user data
     *
     * For now this is only used to stringify current user data in order to save it in local session
     */
    getData() {
        return {
            id: this.id,
            firstName: this.firstName,
            lastName: this.lastName,
            username: this.username,
            email: this.email,
            locale: this.locale,
            photo: this.photo,
            timezone: this.timezone,
            idToken: this.token.id,
            accessToken: this.token.value,
            expiresAt: this.token.expiresAt,
            role: this.role,
            organisation: this.organisation.getData(),
            dateCreated: this.dateCreated,
            subscriptionId: this.subscriptionId,
            mfaToken: this.mfaToken,
            restoreId: this.restoreId,
            userService: this.userService,
            acceptedInvite: this.acceptedInvite,
            accountExpired: this.accountExpired,
            expirationDate: this.expirationDate,
            hasRefreshToken: this.hasRefreshToken,
            permissions: this.permissions,
        };
    }

    isLoggedIn() {
        return !!this.token.value;
    }

    isAdmin() {
        return Authorize.isAdmin(this.role) || this.isDeveloper();
    }

    isExternal() {
        return this instanceof ExternalUser;
    }
    
    isStaff() {
        return this instanceof ServiceUser;
    }
    
    isInvite() {
        return this instanceof InvitedUser;
    }
    
    hasExpired() {
        let expired = moment(this.expirationDate).tz(window.Auth.user.timezone).diff(moment().tz(window.Auth.user.timezone)) <= 0;
        
        return this.accountExpired || expired;
    }
    
    expirationString() {
        if(!this.expirationDate) return '';
        
        let expirationDate = moment(this.expirationDate).tz(window.Auth.user.timezone);
        
        return `${this.hasExpired() ? 'Account expired at' : 'Has access until'} ${expirationDate.format(Config.dateFormats.full)}`;
    }
    
    timezoneString() {
        if(this.timezone === 'UTC') return this.timezone;
        
        return this.timezone + ' UTC' + moment().tz(this.timezone).format('Z');
    }

    hasDomainAccess() {
        // If email domain is not set everybody will have access
        if(!this.organisation.domain) return false;

        return this.email.endsWith('@' + this.organisation.domain);
    }

    canAccess(level) {

        let hasAccess = false;

        if(level === 'domain') {
            hasAccess = this.isAdmin() || this.hasDomainAccess();
        } else {
            hasAccess = this.Authorize.check(level, this.role);
        }

        return hasAccess || this.isDeveloper();
    }

    /**
     * @param {{}} role
     * @param {Number} role.id
     */
    setRole(role){
        this.role = role.id;
    }

    isDeveloper() {
        return DEVELOPERS.indexOf(this.email) >= 0;
    }

    isDemo() {
        if(DEMO.EXCLUDED_USERS.includes(this.email)) return false;
        
        return DEMO.ORGANISATIONS.includes(this.organisation.id) || DEMO.USERS.includes(this.email);
    }
    
    hasPermission(permission) {
        permission = permission.split(' ');
        
        return permission.every((item) => {
            return this.permissions.includes(item);
        });
    }
    
    hasAnyPermission(permission) {
        permission = permission.split(' ');
        
        return permission.some((item) => {
            return this.permissions.includes(item);
        });
    }
}

export class ServiceUser extends User {}

export class ExternalUser extends User {}

export class InvitedUser extends User {}

truedashApp.value('User', User);
