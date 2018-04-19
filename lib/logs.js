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

// List all of the logs and optionaly include the compressed logs
lib.list = (includeCompressedLogs, callback) => {
    fs.readdir(lib.baseDir, (err, data) => {
        if (err && data && data.length) {
            let trimmedFileNames = [];
            data.forEach((fileName) => {
                // add the .log files
                if(fileName.indexOf('.log') > -1) {
                    trimmedFileNames.push(fileName.replace('.log', ''));
                } 

                // add on the .gz files
                if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
                    trimmedFilenames.push(fileName.replace('.gz.b64', ''));
                }
                callback(false, trimmedFileNames);
            });
        } else {
            callback(err, data);
        }
    });
};

// compress the contents of one .log fileinto a .gz.b64 file within the same dir
lib.compress = (logId, newFile, callback) => {
    let sourceFile = logId+'.log';
    let destFile = newFile+'.gz.b64';

    // Read the source file
    fs.readFile(lib.baseDir+sourceFile, 'utf8', (err, inputString) => {
        if(!err && inputString) {
            // compress the data using gzip
            zlib.gzip(inputString, (err, buffer) => {
                if(!err && buffer) {
                    // send the data to the destination file
                   fs.open(lib.baseDir+destFile+'wx', (err, fileDescriptor) => {
                    if (!err && fileDescriptor) {
                        // write to the destination file
                        fs,writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                            if(!err) {
                                // close the destination file
                                fs.close(fileDescriptor, (err) {
                                    if(!err) {
                                        callback(false);
                                    }else(callback(err));
                                });
                            } else {
                                callback(err);
                            }
                        });
                    } else {
                        callback(err);
                    }
                   });
                } else {
                    err
                }
            });
        } else {
            callback(err);
        }
    });
};

// decompress the contents of a .gz.b64 file to a string variable
lib.decompress = (fileId, callback) => {
    let fileName = fileId+'.gz.b64';
    fs.readFile(lib.baseDir+fileName, 'utf8', (err, str) => {
        if (!err && str) {
            // Decompress the data
            let inputBuffer = Buffer.from(str, 'base64');
            zlib.unzip(inputBuffer, (err, outputBuffer) => {
                if (!err && outputBuffer) {
                    // Callback
                    let str = outputBuffer.toString();
                    callback(false, str);
                } else {
                    callback(err);
                }
            });
        } else {
            callback(err);
        }
    });
};

// truncate a log file
lib.truncate = (logId, Callback) => {
    fs.truncate(lib.baseDir+logId+'.log', 0, (err) {
        if(!err) {
            callback(false);
        } else {
            callback(err);
        }
    });
};

// Ecport the module
module.exports = lib;