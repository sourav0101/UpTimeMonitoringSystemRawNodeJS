//file system data read and write in this place.
const fs = require('fs')
const path = require('path')

const lib = {}; 

//file will save in base Directory [.data] folder 
lib.basedir = path.join(__dirname,'/../.data/'); 

//File Create & Write data to the file (CREATE)
lib.create = (dir, fileName, data, callback)=>{ 

    fs.open(`${lib.basedir+dir}/${fileName}.json`,'wx', (error, fileDescriptor)=>{ // wx = new open and write //it will fails if the path exists

        //When no error occur & fileDescriptor exist
        if(!error && fileDescriptor){
            //'data' ta js object hishebe aste pare so,oita k JSON String e convert korte hobe
            const stringData = JSON.stringify(data); 
            //write data to & close it
            fs.writeFile(fileDescriptor, stringData, (error2)=>{ //fileDescriptor is reference
                if(!error2){
                    //when succesfully write done,we have to close this file 
                    fs.close(fileDescriptor,(error3)=>{
                        if(!error3){
                            callback(false) //if not error then, callback will pass 'false'
                        }
                        else{
                            callback(`Error closing the new file`)
                        }
                    }); 
                }else{
                    callback(`Error writing to a new file`);
                }
            })
        }else{
            callback(`Sorry,couldn't create new file or it may already exists!`)
        }
    });   
};

//Read Data from file (READ)
lib.read = (dir, fileName, callback) => {
    fs.readFile(`${lib.basedir+dir}/${fileName}.json`,'utf-8',(err, data)=>{
        callback(err, data)
    });
}; 

//Update data 
lib.update = (dir, fileName, data, callback) =>{
    fs.open(`${lib.basedir+dir}/${fileName}.json`,'r+', (error, fileDescriptor)=>{ 
         //'r+':Open file for read & write,exception occur if file not exists
        if(!error && fileDescriptor){
            const stringData = JSON.stringify(data);
            //truncate the 'newFile.json' file 
            fs.ftruncate(fileDescriptor, (error1)=>{ //'truncate' file empty kora
                if(!error1){
                    //write to the file & close the file 
                    fs.writeFile(fileDescriptor, stringData, (error2)=>{
                        if(!error2){
                           //now closing the file
                           fs.close(fileDescriptor,(error3)=>{
                            if(!error3){
                                callback(false);
                            }
                            else{
                                callback(`Error closing file !`)
                            }
                              
                            });
                        }
                        else{
                            callback(`Error file writing failed !`)
                        }
                    });
                }
                else {
                    //file writing failed
                    callback(`Error truncation file !`);
                }
            }); 
        }
        else{
            callback(`Error updating,file may not exists !`);
        }
    });
   
};

lib.delete = (dir, fileName, callback)=>{
    fs.unlink(`${lib.basedir+dir}/${fileName}.json`,(error)=>{
        if(!error){
            callback(false);
        }
        else{
            callback(`Sorry file deletion failed`);
        }
    })
}




//'directory' pass korle sob file gular list/collection return korbe.
lib.list = (dir,callback) =>{
    fs.readdir(`${lib.basedir + dir}/`,(err, fileNames)=>{ //'fs.readdir' for folder read.
        if(!err && fileNames && fileNames.length > 0){
            //we only need file names not '.json' so,
            const trimmedFileNames = []; 
            fileNames.forEach((fileName)=>{
                trimmedFileNames.push(fileName.replace('.json','')); //json replace with blank
            });
            callback(false, trimmedFileNames); //return callback with data
        }
        else{
            callback('Error reading directory')
        }
    });
}

//export the 'lib' module
module.exports = lib; 