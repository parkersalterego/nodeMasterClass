/*
*
*   Primary API File
*
*/

// DEPENDENCIES
const http = require('http');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;

// the server should respond to all requests with a string
let server = http.createServer((req, res)=> {

    // get url and parse it
    let parsedUrl = url.parse(req.url, true);

    // get path from url
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g,'')

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

        // send response
        res.end('Hello World');

        // log url path asked for in req
        console.log('Request received on path /' + trimmedPath + ' with a method of ' + method + ' and with these query string parameters ',queryStringObject);
        console.log('request received with headers ', headers);
        console.log('This is the payload: ', buffer);

    });
});




// start the server and have it listen on port 3000
server.listen(3000, () => {
    console.log('the server is listening on port 3000');
});