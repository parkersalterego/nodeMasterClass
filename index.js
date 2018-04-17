/*
  Primary file for the API
*/

// Dependencies
let server = require('./lib/server');
let workers = require('./lib/workers');

// application

let app = {};

// initialization function
app.init = () => {
// start the server 
server.init();

// start the workers
workers.init();
};

// Execute
app.init();

// export the app 
module.exports = app;