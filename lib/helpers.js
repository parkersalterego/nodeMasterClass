/*
* Helpers for Various Tasks 
*/

// DEPENDENCIES
const crypto = require('crypto');
const config = require('../config');

// helpers container
const helpers = {};

// Create a SHA256 hash
helpers.hash = (str) => {
    if (typeof(str) == 'string' && str.length > 0) {
        let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// takes in string and returns JSON object via parsing or false if invalid syntax
helpers.parseJsonToObject = (str) => {
    try {
        let obj = JSON.parse(str);
    } catch(e) {
        return {};
    }
};







module.exports = helpers;