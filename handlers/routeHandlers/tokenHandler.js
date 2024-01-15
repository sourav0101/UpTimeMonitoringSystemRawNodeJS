const data = require('./../../lib/data')
const {hash} = require('../../helpers/utilities')
const {createRandomStr} = require('../../helpers/utilities')
const {parseJSON} = require('../../helpers/utilities')

const handler = {}

handler.tokenHandler = (requestProperties, callback) =>{
    //we only accept GET,POST,PUT,DELETE 
    // console.log(requestProperties)
    const acceptedMethods = ['get','post','put','delete']; 
    if(acceptedMethods.indexOf(requestProperties.method)> -1){
        //if checking ok,then calling the private methods given below
        handler._token[requestProperties.method](requestProperties,callback);
    }
    else{
        callback(405) //405 is for 'Method Not Allowed'
    }
}

//private 
handler._token = {}  

handler._token.post = (requestProperties,callback) => {
    //Token Creation
    const phone = 
    typeof requestProperties.body.phone === 'string' && 
    requestProperties.body.phone.trim().length === 11 ? 
    requestProperties.body.phone : false ;

    const password = 
    typeof requestProperties.body.password === 'string' && 
    requestProperties.body.password.trim().length > 0 ? 
    requestProperties.body.password : false ;

    if(phone && password){ //user input 
        //read file
        data.read('users',phone, (err,userData)=>{ 
        //check input password and database password same or not 
        const hasedInputPassword = hash(password) //database hash and input hash checking
        if(hasedInputPassword === parseJSON(userData).password){
            const tokenId = createRandomStr(20); //20 length token id
            const expires = Date.now() + 60*60*1000; //1 hours (mil sec converted)
            const tokenObject = {
                phone,
                'id':tokenId,
                expires,
            };
            //store 'tokenObject' into database
            data.create('tokens',tokenId,tokenObject,(err1)=>{
                if(!err1){
                    callback(200,tokenObject);
                }
                else{
                    callback(500,{error:'There was a problem in server side'})
                }
            });
        }
        else{
            callback(400,{error:'Invalid Password'})
        }
            
      }); 
    }
    else{
        callback(400,{error:'Your password is not valid'});
    }
}

handler._token.get = (requestProperties,callback) =>{
    //queryString Token dia check hobe..
    //http://localhost:3000/token?id=1pk5L0e2K4Kp1j6MPfHI  
    
    const id = typeof requestProperties.queryStringObject.id === 'string' && 
    requestProperties.queryStringObject.id.length === 20 ?
    requestProperties.queryStringObject.id : false; 

    if(id){
        data.read('tokens', id, (err,tokenData)=>{
            const token = {...parseJSON(tokenData)}; 
            if(!err && token){
                callback(200,token);
            }
            else{
                callback(404,{error:'Requested token was not found!'})
            }
        }); 
    }
    else{
        callback(404,{error:'Requested token was not found'})
    }
}

handler._token.put = (requestProperties,callback) =>{
    //Checking...
    //token id 
    //extend 'true'
    //then extend the expire time.
    const id = typeof requestProperties.body.id === 'string' && 
    requestProperties.body.id.trim().length === 20 ?
    requestProperties.body.id : false; 

    const extend = typeof requestProperties.body.extend === 'boolean' && 
    requestProperties.body.extend === true ?
    true : false; 
    
    if(id && extend){
        data.read('tokens',id,(err,tokenData)=>{
            const tokenDataObject = parseJSON(tokenData);
            if(tokenDataObject.expires > Date.now()){ //expires data beshi ase
                tokenDataObject.expires = Date.now()+60*60*1000; 
                //store the updated token
                data.update('tokens', id,tokenDataObject,(err1)=>{
                    if(!err1){
                        callback(200,{message:'Token updated succesfully !'})
                    }else{
                        callback(500,{error:'Server side problem'})
                    }
                }); 
            }
            else{
                callback(400,{error:'Token already expired'})
            }
        });
    }else{
        callback(404,{error:'There was a problem in your request'})
    }

}
handler._token.delete = (requestProperties,callback) =>{
    //http://localhost:3000/token?id=CE085pOMnannemPK539p
    
    const id = 
    typeof requestProperties.queryStringObject.id === 'string' && 
    requestProperties.queryStringObject.id.trim().length === 20 ? 
    requestProperties.queryStringObject.id : false ;

    if(id){
        data.read('tokens', id, (err, tokenData)=>{
            if(!err && tokenData){
                data.delete('tokens', id, (err1)=>{
                    if(!err1){
                        callback(200,{messsage:'Token was succesfully deleted!'})
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
        callback(400,{error:'Requested token invalid'})
    }
}

//token varify [input token ta 'tokens' folder e ase kina]
handler._token.verify =(id, phone, callback)=>{
    data.read('tokens',id,(err, tokenData)=>{ //tokenData = storage token json file
        if(!err && tokenData){
            //storage token (.json) file er phone & expires, input er sathe match korle. 
            if(parseJSON(tokenData).phone === phone && parseJSON(tokenData).expires > Date.now()){
                callback(true);
            }
            else{
                callback(false); 
            }
        }
        else{
            callback(false);
        }
    });
}

module.exports = handler; 