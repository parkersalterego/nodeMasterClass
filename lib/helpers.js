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
        console.log('butts');
        return hash;
    } else {
        return false;
    }
};

// takes in string and returns JSON object via parsing or false if invalid syntax
helpers.parseJsonToObject = (str) => {
    try {
        let obj = JSON.parse(str);
        return obj;
    } catch(err) {
        return err;
    }
};


//create a string of random alphanummeric characters of a given length
helpers.createRandomString = (strLength) => {
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if (strLength) {
        // Define possible chars that can go in to string
        let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // compose the final string
        let str = '';

        for (let i = 0; i < strLength; i++) {
            // Get a random char from possible chars
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // append to str
            str+=randomCharacter;
        }

        //return the final string

        return str;

    } else {
        return false;
    }
}
module.exports = helpers;