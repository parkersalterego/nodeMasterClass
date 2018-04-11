/*
    USER REQUEST HANDLERS
*/

// DEPENDENCIES
const _data = require('../data');
const helpers = require('../helpers');

// define the handlers
const userHandler = {};

// users handler
userHandler.users = (data, callback) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];

    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for users submethods
userHandler._users = {}

// users - post

// required data: firstName, lastName, phone, password, tosAgreement
//optional data: name
userHandler._users.post = (data, callback) => {
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
// required data: phone
//optional data: none
// @TODO only let an authenticated user access their own user object
userHandler._users.get = (data, callback) => {
// check that phone number is valid and unique
let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
if(phone) {
    // lookup the user
    _data.read('users', phone, (err, data) => {
        if (!err && data) {
            // remove hashed password from user object
            delete data.hashedPassword;
            callback(200, data);
        } else {
            callback(404);
        }
    });
} else {
callback(400, {'Error' : 'Missing required field'});
}
};

// users - put
// required data - phone 
// optional data - firstName, lastName, password (at least one must be specified)
// @TODO only let authenticated user update their own user object
userHandler._users.put = (data, callback) => {
// check for the required field
let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;

// check for optional fields
let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

// Error if phone is invalid
if (phone) {
    if(firstName || lastName || password) {
        // lookup  the user
        _data.read('users', phone, (err, userData) => {
            if(!err && userData) {
                //update fields specified
                if (firstName) {
                    userData.firstName = firstName;
                }
                if (lastName) {
                    userData.lastName = lastName;
                }
                if (password) {
                    userData.hashedPassword = helpers.hash(password);
                }

                // store the new user
                _data.update('users', phone, userData, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        console.log(err);
                        callback(500, {'Error' : 'Could not update the user'});
                    }
                });
            } else {
                callback(400, {'Error' : 'The specified user does not exist'});
            }
        });
    } else {
        callback(400, {'Error' : `Missing field(s) to update`});
    }
} else {
    callback(400, {'Error' : 'Missing required field'});
}

};

//users - delete
// required field - phone
// @TODO only llet an authenticated user delete their user object
// @TODO cleanup (delete) any other data files associated with this user
userHandler._users.delete = (data, callback) => {
// check that phone number is valid
let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
if(phone) {
    // lookup the user
    _data.read('users', phone, (err, data) => {
        if (!err && data) {
           _data.delete('users', phone, (err) => {
               if (!err) {
                   callback(200);
               } else {
                   callback(500, {'Error': 'Could not delete the specified user'});
               }
           }); 
        } else {
            callback(400, {'Error' : 'Could not find the specified user'});
        }
    });
} else {
callback(400, {'Error' : 'Missing required field'});
}
};

module.exports = userHandler;