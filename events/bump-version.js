'use strict';

// This file will trigger event that application version is updated and all opened sessions will be prompted to refresh page
// It will be called from Jenkins after each production deployment using this command
// node -e 'require("./events/bump-version.js")'

var Pusher = require('pusher');

var pusher = new Pusher({
    appId: '252233',
    key: 'fe7ecc4da6f621d6d4e4',
    secret: 'f81eaa74e3afc20a8489',
    encrypted: true,
    cluster: 'eu'
});

pusher.trigger('application-updates-app', 'new-version', {
    "title": "New version available",
});
