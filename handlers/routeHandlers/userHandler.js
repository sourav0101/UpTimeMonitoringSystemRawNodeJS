const data = require('./../../lib/data')
const {hash} = require('../../helpers/utilities')
const {parseJSON} = require('../../helpers/utilities')
const tokenHandler = require('./tokenHandler')

const handler = {}

handler.userHandler = (requestProperties, callback) =>{
    //we only accept GET,POST,PUT,DELETE 
    const acceptedMethods = ['get','post','put','delete']; 
    if(acceptedMethods.indexOf(requestProperties.method)> -1){
        //if checking ok,then calling the private methods given below
        handler._users[requestProperties.method](requestProperties,callback);
    }
    else{
        callback(405) //405 is for 'Method Not Allowed'
    }
}

//private 
handler._users = {}  //object 

//USERS CURD OPERATIONS...

//Todo Authentication Done
handler._users.get = (requestProperties,callback) =>{
    //we have to check user information throught primary key
    //http://localhost:3000/user?phone=01857762399
    //here in database primary key is phone number
    //also token in Headers. 
    
    const phone = 
    typeof requestProperties.queryStringObject.phone === 'string' && 
    requestProperties.queryStringObject.phone.trim().length === 11 ? 
    requestProperties.queryStringObject.phone : false ;

    if(phone){ 
        ///verify token [Authentication] part
        //User er data paite gele age token authentication(or,OTP) kore aste hobe.
        //Request er headersObjects er vitore 'token' thake mainly
        //manullay Postman e headers e token ta input dite hobe & 
        //http://localhost:3000/user?phone=01857762399  dite hobe.

        let token = typeof requestProperties.headersObjects.token === 'string'
        ? requestProperties.headersObjects.token : false; 

        tokenHandler._token.verify(token, phone, (tokenId)=>{
        if(tokenId){
            //looking for the user 
            data.read('users', phone, (err, useData)=>{ 
                //file system theke jei data(useData) ta asche seta ekta JSON String(.json)
                //not valid js object so we use parse JSON to make it js object.

                const user = {... parseJSON(useData)}; //spread operator to create a shallow copy of the object

                if(!err && user){
                    //delete user password
                    delete user.password; //delete object property
                    callback(200,user)
                }
                else{
                    callback(404,{error:'Requested user not found !'})
                }
            });
        }
            else{
                callback(403,{error:'Authentication failure !'})
            }
        }); 

    }
    else{
        callback(404,{error:'Requested user not found !'}) //phone number not exit
    }

}

handler._users.post = (requestProperties,callback) => {
    //User Create
    //user firstname,lastname,phone.password & tosAgreement.
    //http://localhost:3000/user

    //Checking Inputs validation part....

    // console.log('requestProperties:',requestProperties)

    const firstName =   
    typeof requestProperties.body.firstName === 'string' && 
    requestProperties.body.firstName.trim().length > 0 ? 
    requestProperties.body.firstName : false ;  //trim() - WhiteSpace removing

    const lastName = 
    typeof requestProperties.body.lastName === 'string' && 
    requestProperties.body.lastName.trim().length > 0 ? 
    requestProperties.body.lastName : false ;

    const phone = 
    typeof requestProperties.body.phone === 'string' && 
    requestProperties.body.phone.trim().length === 11 ? 
    requestProperties.body.phone : false ;

    const password = 
    typeof requestProperties.body.password === 'string' && 
    requestProperties.body.password.trim().length > 0 ? 
    requestProperties.body.password : false ;

    const tosAgreement =
    typeof requestProperties.body.tosAgreement === 'boolean' && 
    requestProperties.body.tosAgreement? 
    requestProperties.body.tosAgreement : false ;


    if(firstName && lastName && phone && password && tosAgreement){
        //User Creating Start
        //but make sure user does not already exist in 'data' folder

        //file read
        data.read('users',phone, (err1)=>{ 
            if(err1){
                //'phone' file not exist
                //so,Create file
                const userObject = {
                    firstName, 
                    lastName,
                    phone,
                    password:hash(password), //password hashing er maddhome store hobe,//by using crypto
                    tosAgreement,
                }; 
                //store the user to db 
                data.create('users', phone, userObject, (err2)=>{
                    if(!err2){
                        callback(200,{
                            message:'User was created succesfully!'
                        })
                    }
                    else{
                        callback(500,{
                            error:'Could not create user!'
                        })
                    }
                }); 


            }
            else{
                //already same user file exist
                callback(500,{'error':'There was a problem in server side'})
            }
        });
    }
    else{
        callback(400,{   //'400' : user er request e problem thakle
            error:'You have a problem in your request'
        })
    }

}

//Todo Authentication Done
handler._users.put = (requestProperties,callback) =>{

    //validations...
    const phone = 
    typeof requestProperties.body.phone === 'string' && 
    requestProperties.body.phone.trim().length === 11 ? 
    requestProperties.body.phone : false ;

    const firstName = 
    typeof requestProperties.body.firstName === 'string' && 
    requestProperties.body.firstName.trim().length > 0 ? 
    requestProperties.body.firstName : false ;

    const lastName = 
    typeof requestProperties.body.lastName === 'string' && 
    requestProperties.body.lastName.trim().length > 0 ? 
    requestProperties.body.lastName : false ;

    const password = 
    typeof requestProperties.body.password === 'string' && 
    requestProperties.body.password.trim().length > 0 ? 
    requestProperties.body.password : false ;

    if(phone) //here, phone: 01762420182 [input data]
    { 
        if(firstName || lastName || password){ //user req body te jekono minimum jekono ekta check korte pare 
            ///Verify token [Authentication] part
            
            const token = typeof requestProperties.headersObjects.token === 'string'
            ? requestProperties.headersObjects.token : false; 
    
            tokenHandler._token.verify(token, phone, (tokenId)=>{
            if(tokenId){
                //looking for user
                data.read('users', phone, (err, uData)=>{
                    const userData = {... parseJSON(uData)}; //direct use korlam nah ekta shallow copy kore nilam
                    if(!err && userData){
                        if(firstName){   //using 3 if because user jekono ekta change korte chaite pare.
                            userData.firstName = firstName; 
                        }
                        if(lastName){
                            userData.lastName = lastName; 
                        }
                        if(password){
                            userData.password = hash(password); 
                        }
                        //Now store into database
                        data.update('users', phone, userData, (err1)=>{
                            if(!err1){
                                callback(200,{message:'User was updated succesfully '})
                            }
                            else{
                                callback(500,{error:'There was a problem in server side'})
                            }
                        });
    
                    }
                    else{
                        callback(400, {error: 'You have a problem in your request!',});
                    }            
                });
                
            }
            else{
                  callback(403,{error:'Authentication failure'})
                }
            });
        }
        else{
            callback(400,{error:'You have a problem in your request!'})
        }
    }
    else{
        callback(400,{error:'Invalid phone number. Please try again!'})
    }
}
//Todo Authentication Done
handler._users.delete = (requestProperties,callback) =>{
    //http://localhost:3000/user?phone=01857762399
    //Request Headers e token = o28gb2nLp4m2oeDPME8P 
    
    const phone = 
    typeof requestProperties.queryStringObject.phone === 'string' && 
    requestProperties.queryStringObject.phone.trim().length === 11 ? 
    requestProperties.queryStringObject.phone : false ;

    if(phone){
            const token = typeof requestProperties.headersObjects.token === 'string'
            ? requestProperties.headersObjects.token : false; 
    
            tokenHandler._token.verify(token, phone, (tokenId)=>{
            if(tokenId){
                //looking for the user 
                data.read('users', phone, (err, userData)=>{
                    if(!err && userData){
                        data.delete('users', phone, (err1)=>{
                            if(!err1){
                                callback(200,{messsage:'User was succesfully deleted!'})
                            }
                            else{
                                callback(500,{error:'There was a server side error!'})
                            }
        
                        });
                    }
                    else{
                        callback(500,{error:'There was a server side error!'})
                    }
                });
            }
                else{
                    callback(403,{error:'Authentication failure !'})
                }
            });
    }
    else{
        callback(400,{error:'There was a problem in your request!'})
    }
}

module.exports = handler; 