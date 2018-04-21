/*
    create and export configuration variables
*/

// container for all environments
const environments = {};

//  staging (defult) environment

environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
    'maxChecks' : 5,
    'twilio' : {
        'accountSid' : 'Acb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3dBc92768f7a67',
        'fromPhone' : '15005550006'
    },
    'templateGlobals' : {
        'appName' : 'UptimeChecker',
        'companyName' : 'NotARealCompany, Inc',
        'yearCreated' : '2018',
        'baseUrl' : 'http://localhost:3000'
    }
};

// Production environment

environments.production = {
    'httpPort' : 5000,
    'httpsPort': 5001,
    'envName' : 'prodution',
    'hashingSecret' : 'thisIsASecret',
    'maxChecks' : 5,
    'twilio' : {
        'accountSid' : 'Acb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3dBc92768f7a67',
        'fromPhone' : '15005550006'
    },
    'templateGlobals' : {
        'appName' : 'UptimeChecker',
        'companyName' : 'NotARealCompany, Inc',
        'yearCreated' : '2018',
        'baseUrl' : 'http://localhost:5000'
    }
};

// determine which environment was passed as a command line argument

let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//check that the current environment is one of the above -- if not then default

let environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// export module

module.exports = environmentToExport;