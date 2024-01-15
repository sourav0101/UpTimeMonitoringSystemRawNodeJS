//'checkHandler.js' for check user define URL
const data = require('./../../lib/data')
const {hash } = require('../../helpers/utilities')
const {parseJSON,createRandomStr} = require('../../helpers/utilities')
const tokenHandler = require('./tokenHandler')
const {maxCheckes} = require('../../helpers/environments')
const { update, indexOf } = require('lodash')


const handler = {}

handler.checkHandler = (requestProperties, callback) =>{
    //we only accept GET,POST,PUT,DELETE 
    const acceptedMethods = ['get','post','put','delete']; 
    if(acceptedMethods.indexOf(requestProperties.method)> -1){
        //if checking ok,then calling the private methods given below
        handler._check[requestProperties.method](requestProperties,callback);
    }
    else{
        callback(405) //405 is for 'Method Not Allowed'
    }
}

//private 
handler._check = {}  //object 


handler._check.post = (requestProperties,callback) => {
    //Create check data

    //validate all inputs
    //user will add 'Protocol' (http/https)
    //user will add 'url'
    //user will add 'METHODS',so server sei url e GET,POST etc. konta dia check korbe.
    //user wiil add 'success code' meaning 200,201,300 for the input link. //that will be an array of codes.
    //user will add 'timeout' for links, how much server will check the website link 5s or 10sec ? & give response msg 'UP' or 'DOWN'.
    
    const protocol = typeof requestProperties.body.protocol ==='string'&& 
    ['http','https'].indexOf(requestProperties.body.protocol)> -1  
    ? requestProperties.body.protocol : false; 

    const url = typeof requestProperties.body.url ==='string'&& 
    requestProperties.body.url.trim().length > 0  
    ? requestProperties.body.url : false;

    const method = typeof requestProperties.body.method ==='string' && 
    ['GET','POST','PUT','DELETE'].indexOf(requestProperties.body.method) > -1 
    ? requestProperties.body.method : false; 

    const successCodes = typeof requestProperties.body.successCodes ==='object' && //user will pass a array of success codes in body
    requestProperties.body.successCodes instanceof Array ? //typeof array is acctually an object so check it.
    requestProperties.body.successCodes : false; 

    
    const timeoutSeconds = typeof requestProperties.body.timeoutSeconds ==='number' 
    && requestProperties.body.timeoutSeconds % 1 === 0 
    && requestProperties.body.timeoutSeconds >= 1 
    && requestProperties.body.timeoutSeconds <=5
    ? requestProperties.body.timeoutSeconds : false;

    if(protocol && url && method && successCodes && timeoutSeconds){
        //token Authentication
        //token validation
        const token = typeof requestProperties.headersObjects.token === 'string'
        ? requestProperties.headersObjects.token : false;
        

        //look up user 'phone' number by reading the given token from headerObjects
        //so goto the token folder files
        data.read('tokens',token,(err, tokenData)=>{
            if(!err && tokenData){
            //tokenData is a .json file so converted it real js object[parseJSON] 
            //and access the 'phone' property
            const userPhone = parseJSON(tokenData).phone;
            //so we got the user phone number 
            //now using phone number we have to find out the user whole data.
            //so we have to go 'users' folder.
            data.read('users', userPhone, (err1,userData)=>{
                if(!err1 && userData){
                    //token Authentication / verify 
                    //user er inputed token ta 'tokens' folder e ase kina setar verification.
                    tokenHandler._token.verify(token,userPhone,(tokenIsValid)=>{
                        if(tokenIsValid){
                            const userObject = parseJSON(userData); //parse kore whole .json obj k real obj e nilam

                            //user er data [.json] te check name e ekta array make hobe[nested].
                            //Below 'userChecks' is input object 
                            const userChecks =    
                            typeof userObject.checks === 'object' && 
                            userObject.checks instanceof Array
                            ? userObject.checks :[]; 

                            //user er checks maximus 5 tar beshi hote dibo na
                            if(userChecks.length < maxCheckes){ //maxCheckes = 5 
                                const checkId = createRandomStr(20); // 20 len er random ekta checkId create hobe
                                //now ekta Check object create korte hobe
                                //jeta amr user folder er user file er json obj er vitor
                                //array akare eksathe save hobe.
                                const checkObject = {
                                    id: checkId,
                                    userPhone,
                                    protocol,
                                    url,
                                    method,
                                    successCodes,
                                    timeoutSeconds,
                                };
                                //Now save this object [save korte gele age file 'create'&'update' korte hobe]
                                //save hobe 'checks' folder e, file er name hobe check id dia.
                                data.create('checks', checkId, checkObject, (err2)=>{
                                    // add check id to the user's object
                                    if(!err2){
                                        userObject.checks = userChecks; //'userChecks' is a input obj, jeta '/users' folder er .json file er 'userObject' e add hobe [nested array]
                                        userObject.checks.push(checkId); //push the newly created 'checkId'
    
                                        //update the new user data on '/users' folder file's userObject
                                        data.update('users',userPhone, userObject,(err3)=>{
                                            if(!err3){
                                                //return the data about 'checkObject' on Response body 
                        
                                                 callback(200, checkObject); 
                                                
                                                //or can send message like succesfully created checks !
                                                //or, callback(200,[userObject,parseJSON(userData)])
                                            }
                                            else{
                                                callback(500,{error:'There was a problem in the server side!'})
                                            }
                                        });
                                    }
                                    else{
                                        callback(500,{error:'Server Side Problem'})
                                    }
 
                                });
                            }
                            else{
                                callback(401,{error:'User has already reached max checkes limit!'})
                            }
                        }
                        else{
                            callback(403, { error: 'Authentication Token problem...!',});
                        }
                    }); 

                }
                else{
                    callback(403,{error:'User not found'}); 
                }
            });
            }
            else{
                callback(403, { error: 'Authentication problem!',});
            }

        }); 

    }   
    else{
        callback(400,{error:'There was a problem in your request!'})
    }

    //Inputs: 
    /**
     * http://localhost:3000/check
     * token : 4AeMaH7PnK7HlneLnOHB
     * body: 
     * {
        "protocol":"http",
        "url":"google.com",
        "method":"GET",
        "successCodes":[200,201],
        "timeoutSeconds": 2
        }
     */

    //Outputs: 
    /*
     * ///'checks' folder 'check data' 
     * {
        "id": "KMkCK6J6N4K8aj4FMBiB",
        "userPhone": "01857762399",
        "protocol": "http",
        "url": "google.com",
        "method": "GET",
        "successCodes": [
            200,
            201
        ],
        "timeoutSeconds": 2
        }

     * ///'users' folder 
        '01857762399.json' file:
    {
        "firstName":"Sourav","lastName":"Das","phone":"01857762399",
        "password":"c61ec189781e767e02b6710c5999bdaddc1e30b43dc89f0d1a0a40145ebe45ff",
        "tosAgreement":true,
        "checks":["KMkCK6J6N4K8aj4FMBiB"] //note: max 5 ta 'checks' elements thakte parbe 
    }
        
     */
    
}
handler._check.get = (requestProperties,callback) =>{
    //get the check data

    //'checks' folder er checks id url e dia verify korbo.
    //id = checks id 
    const id = typeof requestProperties.queryStringObject.id === 'string' && 
    requestProperties.queryStringObject.id.trim().length === 20 ?
    requestProperties.queryStringObject.id : false;  

    if(id){
        //lookup the checks
        data.read('checks',id,(err,checkData)=>{
            if(!err && checkData){
                
                //token verification 
                const token =
                typeof requestProperties.headersObjects.token === 'string'
                ? requestProperties.headersObjects.token
                : false;

                tokenHandler._token.verify(
                    //token id 
                    token,
                    //phone number
                    parseJSON(checkData).userPhone,
                    //callback
                    (tokenIsValid) => {
                        if(tokenIsValid){
                            callback(200,parseJSON(checkData)); 
                        }
                        else{
                            callback(403,{error: 'Authentication failure!'}); 
                        }
                    }
                );                 
            }
            else{
                callback(500,{error:'There was a problem in server side'});  
            }
        });
    }
    else{
        callback(400,{error:'You have a problem in your request...'});
    }

    /*
      http://localhost:3000/check?id=mf3lD27c9lCN29DBCe8k  //check id 
      & token = g87An4GpAkLmImMi0c4M


    output: 
    {
        "id": "mf3lD27c9lCN29DBCe8k",
        "userPhone": "01857762399",
        "protocol": "http",
        "url": "google.com",
        "method": "GET",
        "successCodes": [
            200,
            201
        ],
        "timeoutSeconds": 2
    }

    */
}

handler._check.put = (requestProperties, callback) => {
    //Check id update
    const id =
        typeof requestProperties.body.id === "string" &&
            requestProperties.body.id.trim().length === 20
            ? requestProperties.body.id
            : false;
    //Input validation
    const protocol =
        typeof requestProperties.body.protocol === "string" &&
            ["http", "https"].indexOf(requestProperties.body.protocol) > -1
            ? requestProperties.body.protocol
            : false;

    const url =
        typeof requestProperties.body.url === "string" &&
            requestProperties.body.url.trim().length > 0
            ? requestProperties.body.url
            : false;

    const method =
        typeof requestProperties.body.method === "string" &&
            ["GET", "POST", "PUT", "DELETE"].indexOf(requestProperties.body.method) > -1
            ? requestProperties.body.method
            : false;

    const successCodes =
        typeof requestProperties.body.successCodes === "object" &&
            requestProperties.body.successCodes instanceof Array
            ? requestProperties.body.successCodes
            : false;

    const timeoutSeconds =
        typeof requestProperties.body.timeoutSeconds === "number" &&
            requestProperties.body.timeoutSeconds % 1 === 0 &&
            requestProperties.body.timeoutSeconds >= 1 &&
            requestProperties.body.timeoutSeconds <= 5
            ? requestProperties.body.timeoutSeconds
            : false;

    if (id) {
        //if client want to update at least one..
        if (protocol || url || method || successCodes || timeoutSeconds) {
            //go to the 'checks' folder
            data.read("checks", id, (err, checkData) => {
                
                if (!err && checkData) {
                    const checkObject = parseJSON(checkData); //convert to real JS Object
                    
                    //Token validation
                    const token =
                        typeof requestProperties.headersObjects.token === "string"
                            ? requestProperties.headersObjects.token
                            : false;

                    tokenHandler._token.verify(
                        token,
                        checkObject.userPhone,
                        (tokenIsValid) => {
                            //now change new properties of checkObject
                            if (tokenIsValid) {
                                if (protocol) {
                                    checkObject.protocol = protocol;
                                }
                                if (url) {
                                    checkObject.url = url;
                                }
                                if (method) {
                                    checkObject.method = method;
                                }
                                if (successCodes) {
                                    checkObject.successCodes = successCodes;
                                }
                                if (timeoutSeconds) {
                                    checkObject.timeoutSeconds = timeoutSeconds;
                                }
                                //store the new updated checkObject
                                data.update("checks", id, checkObject, (err1) => {
                                    // console.log('NEW checkobject:',checkObject);

                                    if (!err1) {
                                        callback(200, {error: "Updated Succesfully!" });
                                        // or, callback(200);
                                    } else {
                                        callback(500, {
                                            error: "Update problem in server side!",
                                        });
                                    }
                                });
                            } else {
                                callback(403, {
                                    error: "Authentication error!",
                                });
                            }
                        }
                    );
                } else {
                    callback(500, { error: "Server Side error" });
                }
            });
        } else {
            callback(404, {
                error: "You must provide at least one field to update!",
            });
        }
    } else {
        callback(404, { error: "Problem in client request!" });
    }

    /*
          http://localhost:3000/check?id=mf3lD27c9lCN29DBCe8k
          token: g87An4GpAkLmImMi0c4M
  
          body: 
          {
              "id": "mf3lD27c9lCN29DBCe8k",
              "userPhone": "01857762399",
              "protocol": "http",
              "url": "google.com",
              "method": "GET",
              "successCodes": [
                  200,
                  201
              ],
              "timeoutSeconds": 2
          }
      */
};


handler._check.delete = (requestProperties,callback) =>{

    const id = typeof requestProperties.queryStringObject.id === 'string' && 
    requestProperties.queryStringObject.id.trim().length === 20 ?
    requestProperties.queryStringObject.id : false;

    if(id){
        data.read('checks',id,(err,checkData)=>{
            if(!err && checkData){
                
                const token = typeof requestProperties.headersObjects.token === 'string'
                ? requestProperties.headersObjects.token : false;

                const  checkObject = parseJSON(checkData)
            
                //token verify 
                tokenHandler._token.verify(token,checkObject.userPhone,(tokenIsValid)=>{ //phone number collected from '/checks' folder...
                    if(tokenIsValid){
                        //delete check file..
                        data.delete('checks',id,(err1)=>{
                            if(!err1){
                                // remove the deleted check id from '/users' folder user list of checks
                                data.read('users',checkObject.userPhone,(err2,userData)=>{
                                    const userObject = parseJSON(userData); 
        
                                    if(!err2 && userData){
                                                                            
                                        const userChecks = typeof userObject.checks === 'object'
                                        && userObject.checks instanceof Array
                                        ? userObject.checks : []; 

                                        //delete the check[] elements.
                                        const checkPosition = userChecks.indexOf(id);

                                        if(checkPosition > -1){ //array valid position
                                            // checkObject = userChecks.splice(checkPosition,1); //checkPosition e 1 ta delete
                                            userChecks.splice(checkPosition,1); //checkPosition e 1 ta delete
                                            userObject.checks = userChecks; //newly save user data

                                            data.update('users',userObject.phone, userObject, (err3)=>{
                                                if(!err3){
                                                    callback(200,{
                                                        message:'Successfully deleted!', 
                                                        userChecksArray:userObject.checks, //optional[user er checks array print in response]

                                                    })
                                                }
                                                else{
                                                    callback(500,{error: "Deletion failed!"});
                                                }
                                            }); 
                                        }
                                        else{
                                            callback(500,{error:'checks id not found in the user file'});
                                        }
                                        
                                    }
                                    else{
                                        callback(400,'There is a problem in server')
                                    }
                                });                  
                            }
                            else{
                                callback(400,{error:'Server Side error '}); 
                            }
                        });
                    }
                    else{
                        callback(403,{error:'Authentication problem'});
                    }
                }); 

            }
            else{
                callback(400,{error:'server problem'}); 
            }
        });
    }
    else{
        callback(404,{error:'Problem in client requested id'});

    }


    /*
        http://localhost:3000/check?id=mf3lD27c9lCN29DBCe8k
        token = g87An4GpAkLmImMi0c4M 
    */

    /* 
    TASK : check file deletion
        - check file delete & 
        - users file check[] empty.

        * typically a file Deletion conditions...
        - go to folder 
        - read that file 
        - update that file     
    */ 
}



module.exports = handler; 