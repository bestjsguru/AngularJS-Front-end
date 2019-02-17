'use strict';

truedashApp.filter('findConnection', () => {
    return (connections, params) => {
        if (!params.relation) return false;
        return connections.find(connection => connection.relation.id == params.relation.id);
    };
});

truedashApp.filter('excludeConnection', () => {
    return (connections, params) => {
        return connections.filter(connection => connection.relation.id != params.relation.id);
    };
});
