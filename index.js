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
const config = require('./config');
const fs = require('fs');

// instantiate the HTTP server
let httpServer = http.createServer((req, res)=> {
    unifiedServer(req, res);
    
});

// instantiate the HTTPS server
let httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'), 
    'cert' : fs.readFileSync('./https/cert.pem')
};

let httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
});

// start the http server and have it listen on the specified port
httpServer.listen(config.httpPort, () => {
    console.log('the server is listening on port ' + config.httpPort + ' in ' + config.envName + ' mode');
});

// start the https server and have it listen on the specified port
httpsServer.listen(config.httpsPort, () => {
    console.log('the server is listening on port ' + config.httpsPort + ' in ' + config.envName + ' mode');
});


// server logic for both http and https
let unifiedServer = (req, res) => {
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

        // determine which handler req should goto and if not found send to notFound handler
        let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // construct data object to send to handler
        let data = {    
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        };

        // route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {
            // use the status code called back by handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : '200';
            // use payload called back by handler or default to empty object
            payload = typeof(payload) == 'object'? payload : {};

            // convert payload to a string
            let payloadString = JSON.stringify(payload);

            // return response
            res.writeHead(statusCode);
            res.end(payloadString);

            // log url path asked for in req
            console.log('Returning this response ', statusCode, payload);
        });
    });
}

// define the handlers
const handlers = {};

// ping handler
handlers.ping = (data, callback) => {
    callback(200);
}

// sample handler 
handlers.sample = (data, callback) => {
    // callback http status code and a payload object -- api built to work with json exclusively
    callback(406, {'name' : 'sample handler'});
};

// 404 Not Found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

// Define a request router
const router = {
    'sample' : handlers.sample,
    'ping' : handlers.ping
};