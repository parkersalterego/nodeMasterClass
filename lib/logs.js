/*
    LOGS LIBRARY
*/

// DEPENDENCIES
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Container for module
const lib = {};

// base directory for the logs folder
lib.baseDir = path.join(__dirname, '/../.logs/');

// append a string to a file and create the file if it does not exist

lib.append = (file, str, callback) => {
    // open the file for appending
    fs.open(lib.baseDir+file+'.log','a', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            // Append to the file and close it 
            fs.appendFile(fileDescriptor, str+'\n', (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing the file that was being appended');
                        }
                    });
                }else {
                    callback('Error appending the file');
                }
            });
        } else {
            callback('Could not open the file for appending');
        }
    });
};



// Ecport the module
module.exports = lib;