//Notifications library 
const https = require('https'); 
const querystring = require('querystring');
const {twilio} = require('./environments')

const notifications = {}; 

notifications.sendTwilioSms = (userPhone,userMessage,callback) =>{
    //verify inputs 

    //server : +15064975129 
    //client [user] : 01857762399

    const myUserPhone = typeof userPhone ==='string' 
    && userPhone.trim().length === 11
    ? userPhone.trim() 
    : false; 

    const myUserMessage = typeof userMessage === 'string'
    && userMessage.trim().length > 0 
    && userMessage.trim().length <= 1600
    ? userMessage.trim() 
    : false;

    if(myUserPhone && myUserMessage){

        //Configure the request payload
        const payload = {
            From: twilio.fromPhone,
            To:`+88${myUserPhone}`, 
            Body: userMessage,
        }; 
        //Request payload Object ta JSON string kore pathate hobe
        const stringifyPayload = querystring.stringify(payload); // or, JSON.stringify(payload); 

        //send 'https' request to 'twilio server'

        // configure the request details as a object 
        const requestDetailsObject = {
            hostname:'api.twilio.com',
            method:'POST',
            path:`/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
            auth:`${twilio.accountSid}:${twilio.authToken}`,
            headers: {
                'Content-Type':'application/x-www-form-urlencoded'
            }
        }; 
        // instantiate the request details object
        const request = https.request(requestDetailsObject,(response)=>{
            const status = response.statusCode; 
            // console.log('twilio status:',status)
            if(status === 200 || status === 201){ //if any of statusCode returned
                callback(true); //no error
            }
            else{
                callback(`Returned response status code:${status}`);
            }
        });

        request.on('error',(e)=>{  //Request object er moddhe error hole fire kore, or internet network problem or 'requestDetailsObject'
            callback({      
                'msg':'Error in your request',
                'e:':e,
            }) 
        });

        request.write(stringifyPayload) //Request er sathe payload tao jabe
        request.end(); 
    }
    else{
        callback('Your given paramenters were missing,invalid inputs')
    }

}; 

module.exports = notifications; 