/*
* Helpers for Various Tasks
*/

// DEPENDENCIES
const crypto = require('crypto');
const config = require('../config');
const https = require('https');
const querystring = require('querystring');

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


// send sms via twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
    // validate parameters
    phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone : false;
    msg = typeof(msg) == 'string' && msg.trim().length <= 1600 ? msg.trim() : false;

    if (phone && msg) { 
        // Configure request payload to be sent to twilio
        let payload = {
            'From' : config.twilio.fromPhone, 
            'To' : '+1'+phone,
            'Body' : msg
        };

        // stringify the payload
        let stringPayload = querystring.stringify(payload);

        // configure request details
        let requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.twilio.com',
            'method': 'POST',
            'path' : '/2010-04-01/Accounts/' +config.twilio.accountSid+'/Messages.json',
            'auth' : config.twilio.accountSid+':'+config.twilio.authToken,
            'headers' : {
                'Content-Type' : 'application/x-www-url-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        let req = https.request(requestDetails, (res) => {
            // grab status of the sent request
            let status = res.statusCode;
            // callback successfully if request went through
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned was ' + status);
            }
        });

        // Bind to error event so it does not get thrown 
        req.on('error', (e) => {
            callback(e);
        });

        // add payload to request
        req.write(stringPayload);

        // end request
        req.end();


    }else {
        callback('Given paramerers were missing or invalid');
    }
};

module.exports = helpers;