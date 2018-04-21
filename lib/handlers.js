/*
    REQUEST HANDLERS
*/

// DEPENDENCIES
const _data = require('./data');
const helpers = require('./helpers');
const config = require('../config');

const handlers = {};

// ================================================================ HTML HANDLERS =======================================================================

    handlers.index = (data, callback) => {
        // reject all req other than GET
        if (data.method == 'get') {
            // prepare data for interpolation
            let templateData = {
                'head.title' : 'This is the title',
                'head.description' : 'This is the meta description',
                'body.title' : 'Hello templated world',
                'body.class' : 'index'
            };
            // Read in a template as a string
            helpers.getTemplate('index',templateData,function(err,str){
                if(!err && str){
                // Add the universal header and footer
                helpers.addUniversalTemplates(str,templateData,function(err,str){
                    if(!err && str){
                    // Return that page as HTML
                    callback(200,str,'html');
                    } else {
                    callback(500,undefined,'html');
                    }
                });
                } else {
                callback(500,undefined,'html');
                }
            });
        } else {
            callback(405, undefined, 'html');
        }
    };

// ================================================================= JSON API HANDLERS ===================================================================

// ping handler
handlers.ping = (data, callback) => {
    callback(200);
};

// sample handler 
handlers.sample = (data, callback) => {
    // callback http status code and a payload object -- api built to work with json exclusively
    callback(406, {'name' : 'sample handler'});
};

// 404 Not Found handler
handlers.notFound = (data, callback) => {
    callback(404);
};

// ========================================= USERS SERVICE STARTS =============================================

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

// required data: firstName, lastName, phone, password, tosAgreement
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
// required data: phone
//optional data: none
handlers._users.get = (data, callback) => {
// check that phone number is valid and unique
let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
if(phone) {
    // Get the token from the headers
    let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    //verify that given token is valid and asigned to user being accessed
    handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
        if(tokenIsValid) {
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
                callback(403, {'Error' : 'Missing required token in header or token is invalid'});
            }
        });
    } else {
    callback(400, {'Error' : 'Missing required field'});
    }
};

// users - put
// required data - phone 
// optional data - firstName, lastName, password (at least one must be specified)
handlers._users.put = (data, callback) => {
    // check for the required field
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

    // check for optional fields
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    // Error if phone is invalid
    if (phone) {
        if(firstName || lastName || password) {

            // Get the token from the headers
            let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            handlers._tokens.verifyToken(token, phone, (tokenIsValid) => {
                if(tokenIsValid) {
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
                    callback(403, {'Error' : 'Missing required token in header or token is invalid'});
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
handlers._users.delete = function(data,callback){
    // Check that phone number is valid
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
  
      // Get token from headers
      let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  
      // Verify that the given token is valid for the phone number
      handlers._tokens.verifyToken(token,phone,function(tokenIsValid){
        if(tokenIsValid){
          // Lookup the user
          _data.read('users',phone,function(err,userData){
            if(!err && userData){
              // Delete the user's data
              _data.delete('users',phone,function(err){
                if(!err){
                  // Delete each of the checks associated with the user
                  let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                  let checksToDelete = userChecks.length;
                  if(checksToDelete > 0){
                    let checksDeleted = 0;
                    let deletionErrors = false;
                    // Loop through the checks
                    userChecks.forEach(function(checkId){
                      // Delete the check
                      _data.delete('checks',checkId,function(err){
                        if(err){
                          deletionErrors = true;
                        }
                        checksDeleted++;
                        if(checksDeleted == checksToDelete){
                          if(!deletionErrors){
                            callback(200);
                          } else {
                            callback(500,{'Error' : "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully."})
                          }
                        }
                      });
                    });
                  } else {
                    callback(200);
                  }
                } else {
                  callback(500,{'Error' : 'Could not delete the specified user'});
                }
              });
            } else {
              callback(400,{'Error' : 'Could not find the specified user.'});
            }
          });
        } else {
          callback(403,{"Error" : "Missing required token in header, or token is invalid."});
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field'})
    }
  };

// =============================== TOKENS SERVICE STARTS ===============================================

// tokens handler
handlers.tokens = (data, callback) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];

    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// tokens container
handlers._tokens = {};

// Tokens - POST
// Required data: phone, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (phone && password) {
        // lookup user that matches phone number
        _data.read('users', phone, (err, userData) => {
            if(!err && userData) {
                // hash the sent password and compare to passwordHash stored in user obj
                let hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    // if, valid create a new token with a 1hr expiration time
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now( ) + 1000 * 60 * 60;
                    let tokenObject = {
                        'phone' : phone,
                        'id' : tokenId,
                        'expires': expires
                    };

                    // store token
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, {'Error': 'Could not create the new token'});
                        }
                    });
                } else {
                    callback(400, {'Error' : 'User information provided did not match'});
                }
            }else {
                callback(400, {'Error' : 'Could not find the specified user'});
            }
        })
    }else {
        callback(400, {'Error': 'Missing required fields'});
    }
}

// Tokens - GET
// required data : id
// Optional data : none
handlers._tokens.get = (data, callback) => {
    // check that id sent is valid
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        // lookup the user
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                // remove hashed password from user object
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
    callback(400, {'Error' : 'Missing required field'});
    }
}

// Tokens - PUT
// required data : id, extend
// optional data : none
handlers._tokens.put = (data, callback) => {
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    let extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? data.payload.extend : false;
    if (id && extend) {
        _data.read('tokens', id, (err, tokenData) => {
            if(!err && tokenData) {
                // check that the token is not already expired
                if (tokenData.expires > Date.now()) {
                    // set the expiration at an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    // store the new updates
                    _data.update('tokens', id, tokenData, (err) => {
                        if(!err) {
                            callback(200);
                        } else {
                            callback(500, {'Error' : 'Could not update the token\'s expiration'});
                        }
                    });
                } else {
                    callback(400, {'Error' : 'The token has already ecpired, and cannot be extended'});
                }
            } else {
                callback(400, {'Error' : 'Specified token does not exist'});
            }
        });
    } else {
        callback(400, {'Error' : `Missing required field(s) or field(s) is/are invalid`});
    }
}

// Tokens - DELETE
// required data : id
// optional data : none
handlers._tokens.delete = (data, callback) => {
    // check that id is valid
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        // lookup the token
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
            _data.delete('tokens', id, (err) => {
                if (!err) {
                    callback(200);
                } else {
                    callback(500, {'Error': 'Could not delete the specified token'});
                }
            }); 
            } else {
                callback(400, {'Error' : 'Could not find the specified token'});
            }
        });
    } else {
    callback(400, {'Error' : 'Missing required field'});
    }
}

// Verify if given tokenId is currently valid for a given user
handlers._tokens.verifyToken = (id, phone, callback) => {
    // Lookup token
    _data.read('tokens', id, (err, tokenData) => {
        if(!err && tokenData) {
            // check that the token is for the given user and is not expired
            if (tokenData.phone == phone && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        }else {
            callback(false);
        }
    });
};

// ======================== CHECKS SERVICE STARTS ==================================

// checks
handlers.checks = (data, callback) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];
    if (acceptableMethods.indexOf(data.method0 > -1)) {
        handlers._checks[data.method](data, callback);
    }
};

// container for checks methods

handlers._checks = {};

//checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// optional data : none
handlers._checks.post = (data, callback) => {
    // validate inputs
    let protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    let method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // Get the token from the headers 
        let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // lookup user by token
        _data.read('tokens', token, (err, tokenData) => {
            if(!err, tokenData) {
                let userPhone = tokenData.phone;

                //lookup the user data by phone
                _data.read('users', userPhone, (err, userData) => {
                    if(!err && userData) {
                        let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                        // verify that user will not exceed maximum number of allowed checks
                        if (userChecks.length < config.maxChecks)  {
                            // create random id for the check
                            let checkId = helpers.createRandomString(20);

                            // create the check object, and include the users phone as a reference
                            let checkObject = {
                                'id' : checkId,
                                'userPhone' : userPhone,
                                'protocol' : protocol,
                                'url' : url,
                                'method' : method,
                                'successCodes' : successCodes,
                                'timeoutSeconds' : timeoutSeconds
                            };

                            // save the object 
                            _data.create('checks', checkId, checkObject, (err) => {
                                if (!err) {
                                    // add Check id to user object
                                    userData.checks = userChecks;
                                    userData.checks.push(checkId);

                                    // save the new user data
                                    _data.update('users', userPhone, userData, (err) => {
                                        if (!err) {
                                            // return the data about the new check to requester
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {'Error' : 'Could not update the user with the new check '});
                                        }
                                    });
                                } else {
                                    callback(500, {'Error' : 'Could not create the new check'});
                                }
                            });
                        } else {
                            callback(400, {'Error' : 'User already has the maximum number of checks'});
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });
    }else {
        callback(400, {'Error' : 'Missing required inputs or inputs are invalid'});
    }
};

// checks - get
// required data : id
//optional data : none
handlers._checks.get = (data, callback) => {
    // check that id is valid and unique
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id) {
        // lookup check 
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                // Get the token from the headers
                let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
                //verify that given token is valid and asigned to user being accessed
                handlers._tokens.verifyToken(token, checkData.userPhone, (tokenIsValid) => {
                    if(tokenIsValid) {
                        // return the check data
                        callback(200, checkData);
                        } else {
                            callback(403);
                        }
                    });
            } else {
                callback(404);
            }
        });
        } else {
        callback(400, {'Error' : 'Missing required field'});
        }
    };

// checks - put
// required data : id
// optional data : protocol, url, method, successCodes, timeoutSeconds (at least one must be sent)
handlers._checks.put = function(data,callback){
    // Check for required field
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  
    // Check for optional fields
    let protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    let method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    let successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  
    // Error if id is invalid
    if(id){
      // Error if nothing is sent to update
      if(protocol || url || method || successCodes || timeoutSeconds){
        // Lookup the check
        _data.read('checks',id,function(err,checkData){
          if(!err && checkData){
            // Get the token that sent the request
            let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify that the given token is valid and belongs to the user who created the check
            handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
              if(tokenIsValid){
                // Update check data where necessary
                if(protocol){
                  checkData.protocol = protocol;
                }
                if(url){
                  checkData.url = url;
                }
                if(method){
                  checkData.method = method;
                }
                if(successCodes){
                  checkData.successCodes = successCodes;
                }
                if(timeoutSeconds){
                  checkData.timeoutSeconds = timeoutSeconds;
                }
  
                // Store the new updates
                _data.update('checks',id,checkData,function(err){
                  if(!err){
                    callback(200);
                  } else {
                    callback(500,{'Error' : 'Could not update the check.'});
                  }
                });
              } else {
                callback(403);
              }
            });
          } else {
            callback(400,{'Error' : 'Check ID did not exist.'});
          }
        });
      } else {
        callback(400,{'Error' : 'Missing fields to update.'});
      }
    } else {
      callback(400,{'Error' : 'Missing required field.'});
    }
  };

// checks - DELETE
// required data : id
// optional data : none

handlers._checks.delete = function(data,callback){
    // Check that id is valid
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the check
      _data.read('checks',id,function(err,checkData){
        if(!err && checkData){
          // Get the token that sent the request
          let token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
            if(tokenIsValid){
  
              // Delete the check data
              _data.delete('checks',id,function(err){
                if(!err){
                  // Lookup the user's object to get all their checks
                  _data.read('users',checkData.userPhone,function(err,userData){
                    if(!err){
                      let userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
  
                      // Remove the deleted check from their list of checks
                      let checkPosition = userChecks.indexOf(id);
                      if(checkPosition > -1){
                        userChecks.splice(checkPosition,1);
                        // Re-save the user's data
                        userData.checks = userChecks;
                        _data.update('users',checkData.userPhone,userData,function(err){
                          if(!err){
                            callback(200);
                          } else {
                            callback(500,{'Error' : 'Could not update the user.'});
                          }
                        });
                      } else {
                        callback(500,{"Error" : "Could not find the check on the user's object, so could not remove it."});
                      }
                    } else {
                      callback(500,{"Error" : "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."});
                    }
                  });
                } else {
                  callback(500,{"Error" : "Could not delete the check data."})
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400,{"Error" : "The check ID specified could not be found"});
        }
      });
    } else {
      callback(400,{"Error" : "Missing valid id"});
    }
  };


// export module
module.exports = handlers;