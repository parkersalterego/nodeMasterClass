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
