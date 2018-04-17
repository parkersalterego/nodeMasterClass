/*
  WORKERS LIBRARY
*/

// DEPENDENCIES
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const https = require('https');
const http = require('http');
const helpers = require('./helpers');
const url = require('url');
const _logs = require('./logs');

// instantiate worker objects
const workers = {};

// lookup checks, get their data, and forward to validator
workers.gatherAllChecks = () => {
  // get all the checks
  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach((check) => {
        // read in the check data
        _data.read('checks', check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            // pass the data to the check validator
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error reading one of the checks data');
          }
        });
      });
    } else {
      console.log('Error: Could not find any checks to process');
    }
  });
};


// sanity-checking the check-data
workers.validateCheckData = (originalCheckData) => {
  originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : false;
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.length == 20 ? originalCheckData.id : false;
  originalCheckData.phone = typeof(originalCheckData.phone) == 'string' && originalCheckData.phone.length == 10 ? originalCheckData.phone : false;
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.length > 0 ? originalCheckData.url : false;
  originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
  originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

  // set keys that may not be set if workers have not seen this check before
  originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

  // If all the checks pass, pass the data along to the next step in the process
  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol && 
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData. successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    console.log('Error: One of the checks is not properly formatted. Skipping check.');
  }

};

// perform the check, send the original check data and the outcome of the check process
workers.performCheck = (originalCheckData) => {
  // prepare the initial check outcome
  let checkOutcome = {
    'error' : false,
    'responseCode' : false,
  };

  // mark that the outcome has not been sent yet
  let outcomeSent = false;

  // parse the hostname and path from originalCheckData
  let parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
  let hostName = parsedUrl.hostname;
  let path = parsedUrl.path; //using 'path' not 'pathname' because we want the querystring

  // construct the request
  let requestDetails = {
    'protocol' : originalCheckData.protocol + ':',
    'hostname' : hostName,
    'method' : originalCheckData.method.toUpperCase(),
    'path' : path,
    'timeout' : originalCheckData.timeoutSeconds * 1000
  };

  // Instantiate the request oibject using either the http or https module
  let _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
  let req = _moduleToUse.request(requestDetails, (res) => {
    // grab status of the sent request
    let status = res.statusCode;

    // update the checkOutcome and pass the data along
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to error event so it does not get thrown
  if ('error', (e) => {
    // update the checkOutcome and pass the data along
    checkOutcome.error = {
      'error' : true,
      'value' : e
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // Bind to the timeout event
  if ('timeout', (e) => {
    // update the checkOutcome and pass the data along
    checkOutcome.error = {
      'error' : true,
      'value' : 'timeout'
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // end the request
  req.end();
};

// process the check outcome and update the check data as needed in order to trigger an alert to the user if necesary
// special logic for accomadating a check that has never been tested for before (son't send alert);

workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
  // decide if the check is up or down
  let state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

  // Determine if an alert is waranted
  let alertWaranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

  // log the outcome of the check 
  let timeOfCheck = Date.now();
  workers.log(originalCheckData,checkOutcome,state,alertWaranted,timeOfCheck);

  // update the check data
  let newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = timeOfCheck;

  // save the updates
  _data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      // send the new check data to the next phase in the process if needed
      if (alertWaranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log('Check outcome has not changed no alert needed');
      }
    } else {
      console.log('Error trying to save updates to one of the checks');
    }
  });
};

// alert the user as to a change to their check status
workers.alertUserToStatusChange = (newCheckData) => {
  let msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + ' '+newCheckData.protocol+ '://' + newCheckData.url + ' is currently up';

  helpers.sendTwilioSms(newCheckData.userPhone, msg, (err) => {
    if (!err) {
      console.log('Success: User was alerted to a status change to their check via sms ', msg);
    } else {
      console.log('Error: Could not send sms alert to user who had a state change in their check');
    }
  });
};

workers.log = (originalCheckData,checkOutcome,state,alertWaranted,timeOfCheck) => {
  // form the log data
  let logData = {
    'check' : originalCheckData,
    'outcome' : checkOutcome,
    'state' : state,
    'alert' : alertWaranted,
    'time' : timeOfCheck
  };

  // convert the data to a string
  let logString = JSON.stringify(logData);

  // Determine the name of the log file
  let logFileName = originalCheckData.id;

  // Append the log string to the file 
  _logs.append(logFileName, logString, (err) => {
    if (!err) {
      console.log('Success: Logging to file succeeded');
    } else {
      console.log('Error: logging to file failed');
    }
  });
};

// Timer to execute worker proccess once per minute
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

// init script
workers.init = () => {
  // ececute all the checks immediately
  workers.gatherAllChecks();
  // call a loop so checks continue to execute
  workers.loop();
};

// export the module
module.exports = workers;