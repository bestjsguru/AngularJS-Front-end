/**
 * This is a nodejs server use for local development purposes
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var express = require('express');

var root = __dirname + '/app';
var restGetURLs = ['/truedash'];
var backendUrl = process.env.BACKEND_URL || 'https://dev.avora.com/';

function run() {
    
    var proxy = require('http-proxy').createProxyServer({
        changeOrigin: true,
        target: backendUrl
    });
    
    var app = express();
    
    app.use('/', express.static(root));
    
    app.get('*', function (req, res, next) {
        if (!testStartWith(restGetURLs, req.url)) {
            res.sendFile('index.html', {root: root});
        } else {
            next();
        }
    });
    
    app.all('*', function (req, res) {
        proxy.web(req, res, undefined, function (err) {
            console.log('Error:', err);
        });
    });
    
    var server = https.createServer({
        key: fs.readFileSync(path.resolve('cert/server.key')),
        cert: fs.readFileSync(path.resolve('cert/server.crt'))
    }, app).listen(443);
    
    console.log('Root is: ' + root.green);
    console.log('Used backend: ' + backendUrl.green);
    
    return server;
}

function testStartWith(arr, target) {
    return !arr.every(function(str) {
        var regEx = new RegExp( '^'+str );
        return !regEx.test(target);
    });
}

module.exports = {
    run: run
};

if (!module.parent) run();
