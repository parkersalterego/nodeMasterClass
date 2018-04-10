const fs = require('fs');
const path = require('path');

// Container for module (to be exported)
let lib = {}

// base directory of data folder
lib.baseDir = path.join(__dirname, '/../.data/');

// write data to file
lib.create = (dir, file, data, callback) => {

    // open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json', 'wx', (err, fileDescriptor) => {
        if(!err && fileDescriptor) {
            // convert data to string
            let stringData = JSON.stringify(data);

            // write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if(!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        }else {
                            callback('Error closing new file')
                        }
                    })
                } else {
                    callback('Error writing to new file');
                }
            })
        } else {
            callback('Could not create new file, it may already exist');
        }
    });

    
}

// read data from a file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json', 'utf8', (err, data) => {
        callback(err, data);
    });
};

// update data inside a file

lib.update = (dir, file, data, callback) => {
    // open file for writing
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+', (err, fileDescriptor) => {
        if(!err && fileDescriptor) { 
            // convert data to string
            let stringData = JSON.stringify(data);

            // truncate the file
            fs.truncate(fileDescriptor, (err) => {
                if(!err) {
                    //write to file and close
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if(!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('error closing file');
                                }
                            });
                        } else {
                            callback('Error writing to file');
                        }
                    });
                } else{
                    callback('error truncating file');
                }
            });
        }else {
            callback('Could not open the file for updating, it may not exist yet');
        }
    });
};

lib.delete = (dir, file, callback) => {
    // unlink the file
    fs.unlink(lib.baseDir+dir+'/'+file+'.json', (err) => {
        if (!err) {
            callback(false);
        } else {
            callback('unable to delete file');
        }
    });
}

// Export module 
module.exports = lib;