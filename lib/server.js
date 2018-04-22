/*
*
*   Primary API File
*
*/

// DEPENDENCIES
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('../config');
const fs = require('fs');
const helpers = require('./helpers');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');
// const _data = require('./lib/data');

// HANDLERS
const handlers = require('./handlers');

// instantiate the server module object
let server = {};

// instantiate the HTTP server
server.httpServer = http.createServer((req, res)=> {
    server.unifiedServer(req, res);
    
});

// instantiate the HTTPS server
server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')), 
    'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
    server.unifiedServer(req, res);
});

// server logic for both http and https
server.unifiedServer = (req, res) => {
    // get url and parse it
    let parsedUrl = url.parse(req.url, true);

    // get path from url
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g,'');

    // get the query string as an object
    let queryStringObject = parsedUrl.query;

    // get the http method
    let method = req.method.toLowerCase();

    // get http headers as an object
    let headers = req.headers;

    // get payload if any
    let decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();
        debug(buffer);

        // determine which handler req should goto and if not found send to notFound handler
        let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // if the request is within the public dir use the public handler instead
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        // construct data object to send to handler
        let data = {    
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };
        debug(data.payload);
        // route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload, contentType) => {
            // Determine the type of response (fallback to JSON)
            contentType = typeof(contentType) == 'string' ? contentType : 'json';
            // use the status code called back by handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : '200';

            // retutn the response parts that are content-specific
            let payloadString = '';
            if (contentType == 'json') {
                res.setHeader('ContentType', 'application/json');
                payload = typeof(payload) == 'object'? payload : {};
                payloadString = JSON.stringify(payload);
            }
            if (contentType == 'html') {
                res.setHeader('ContentType', 'text/html');
                payloadString = typeof(payload) == 'string' ? payload : '';
            }
            if (contentType == 'favicon') {
                res.setHeader('ContentType', 'image/x-icon');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'css') {
                res.setHeader('ContentType', 'text/css');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'png') {
                res.setHeader('ContentType', 'image/png');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'jpg') {
                res.setHeader('ContentType', 'image/jpeg');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'plain') {
                res.setHeader('ContentType', 'text/plain');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }
            

            // return response parts that are common to all content types
            res.writeHead(statusCode);
            res.end(payloadString);

            // log url path asked for in req and if the res is 200 print green, otherwise print red
            if (statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + '/' + 'trimmedPath' + ' ' + statusCode);
            } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + '/' + 'trimmedPath' + ' ' + statusCode);
            }
        });
    }); 
};

// Define a request router
server.router = {
    '' : handlers.index,
    'account/create' : handlers.accountCreate,
    'account/edit' : handlers.accountEdit,
    'account/deleted' : handlers.accountDeleted,
    'session/create' : handlers.sessionCreate,
    'session/deleted' : handlers.sessionDeleted,
    'checks/all' : handlers.checkList,
    'checks/create' : handlers.checksCreate,
    'checks/edit' : handlers.checksEdit,
    'ping' : handlers.ping,
    'api/users' : handlers.users,
    'api/tokens' : handlers.tokens,
    'api/checks' : handlers.checks,
    'favicon.ico' : handlers.favicon,
    'public/' : handlers.public
};

// Init script
server.init = () => {
    // start the http server and have it listen on the specified port
    server.httpServer.listen(config.httpPort, () => {
        console.log('\x1b[36m%s\x1b[0m', 'The server is listening on port ' + config.httpPort);
    });

    // start the https server and have it listen on the specified port
    server.httpsServer.listen(config.httpsPort, () => {
        console.log('\x1b[35m%s\x1b[0m', 'The server is listening on port ' + config.httpsPort);
    });

};

// export module
module.exports = server;