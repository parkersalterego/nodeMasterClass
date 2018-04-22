/*
* Helpers for Various Tasks
*/

// DEPENDENCIES
const crypto = require('crypto');
const config = require('../config');
const https = require('https');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');

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

// get the string content of a template
helpers.getTemplate = (templateName, data, callback) => {
    templateName = typeof(templateName) == 'string' && templateName.length > 0 ? templateName : false;
    data = typeof(data) == 'object' && data !== null ? data : {};

    if (templateName) {
        let templatesDir = path.join(__dirname, '/../templates/');
        fs.readFile(templatesDir + templateName + '.html', 'utf8', (err, str) => {
            if( !err && str && str.length > 0) {
                // do interpolation on the string
                let finalString = helpers.interpolate(str, data);
                callback(false, finalString);
            } else {
                callback('No template could be found');
            }
        });
    } else {
        callback('A valid template was not specified');
    }
};

// Add the universal header and footer to a string and pass the data obj to the header and footer for interpolation
helpers.addUniversalTemplates = (str, data, callback) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};
    // get the header
    helpers.getTemplate('_header', data, (err, headerString) => {
        if (!err && headerString) {
            // get the footer
            helpers.getTemplate('_footer', data, (err, footerString) => {
                if (!err && footerString) {
                    // add the strings together
                    let fullString = headerString + str + footerString;
                    callback(false, fullString);
                } else {
                    callback('Could not find the footer template');
                }
            });
        } else {
            callback('Could not find the header template');
        }
    });
};


// take a given string and data object then find / replace all of the keys within it
helpers.interpolate = (str, data) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : '';
    data = typeof(data) == 'object' && data !== null ? data : {};

    // add the templateGlobals to the data object prefixing their name with "global"
    for (let keyName in config.templateGlobals) {
        if (config.templateGlobals.hasOwnProperty(keyName)) {
            data['global.' + keyName] = config.templateGlobals[keyName];
        }
    }

    // for each key in the data obj insert it's value in to the string at the corresponding placeholder
    for (let key in data) {
        if (data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
            let replace = data[key];
            let find = '{'+key+'}';
            str = str.replace(find, replace);
        }
    }
    return str;
};

// get the contents of a static (public) asset
helpers.getStaticAsset = (fileName, callback) => {
    fileName = typeof(fileName) =='string' && fileName.length > 0 ? fileName : false;
    if (fileName) {
        let publicDir = path.join(__dirname,'/../public/');
        fs.readFile(publicDir+fileName, (err, data) => {
            if (!err && data) {
                callback(false, data); 
            } else {
                callback('A valid file name was not specified');
            }
        });
    } else {
        callback('A valid filename was not specified');
    }
};



module.exports = helpers;