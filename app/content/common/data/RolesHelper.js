"use strict";

export const ROLES = {
    ROLE_VIEW: 5,
    ROLE_USER: 4,
    ROLE_ADMIN: 3,
    ROLE_EXTERNAL_USER: 6
};

export const ALL_ROLES = [{
    id: ROLES.ROLE_USER,
    title: 'Basic User',
    name: 'ROLE_USER'
},{
    id: ROLES.ROLE_ADMIN,
    title: 'Admin',
    name: 'ROLE_ADMIN'
},{
    id: ROLES.ROLE_VIEW,
    title: 'Read-only',
    name: 'ROLE_USER_VIEW'
}, {
    id: ROLES.ROLE_EXTERNAL_USER,
    title: 'External user',
    name: 'ROLE_EXTERNAL_USER'
}];

export const RoleService = {
    getTitleById(id){
        return (ALL_ROLES.find(role => role.id === id) || {}).title;
    },

    getNameById(id){
        return (ALL_ROLES.find(role => role.id === id) || {}).name;
    },

    getIdByName(name){
        return (ALL_ROLES.find(role => role.name === name) || {}).id;
    }
};
