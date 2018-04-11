/*
    REQUEST HANDLERS
*/

// DEPENDENCIES
const _data = require('./data');
const helpers = require('./helpers');

// define the handlers
const handlers = {};

// users handler
handlers.users = (data, callback) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];

    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for users submethods
handlers._users = {}

// users - post

// required date: firstName, lastName, phone, password, tosAgreement
//optional data: name
handlers._users.post = (data, callback) => {
    console.log('this is in the handler: ', data);
// check that all required fields are filled out
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // make sure user doesn't already exist
        _data.read('users', phone, (err, data) => {
            if(err) {
                // hash password
                let hashedPassword = helpers.hash(password);

                // create a user object
                if (hashedPassword) {
                    let userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'phone': phone,
                        'hashedPassword': hashedPassword,
                        'tosAgreement': true
                    };
    
                    //store the user
                    _data.create('users', phone, userObject, (err) => {
                        if(!err) {
                            callback(200);
                        } else {
                            console.log(err);
                            callback(500, {'Error': 'Could not create user'});
                        }
                    });
                } else {
                    callback(500, {'Error' : 'could not hash the user\'s password'});
                }
            } else {
                // user already exists
                callback(400, {'Error' : 'A user with that phone number already exists'});
            }
        });
    } else {
        callback(400, {'Error' : 'Missing required fields'});
    }
};

// users - get 
handlers._users.get = (data, callback) => {

};

// users - put
handlers._users.put = (data, callback) => {

};

//users - delete
handlers._users.delete = (data, callback) => {

};

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

// export module
module.exports = handlers;