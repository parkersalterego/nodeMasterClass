/*
    create and export configuration variables
*/

// container for all environments
const environments = {};

//  staging (defult) environment

environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging'
};

// Production environment

environments.production = {
    'httpPort' : 5000,
    'httpsPort': 5001,
    'envName' : 'prodution'
};

// determine which environment was passed as a command line argument

let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//check that the current environment is one of the above -- if not then default

let environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// export module

module.exports = environmentToExport;