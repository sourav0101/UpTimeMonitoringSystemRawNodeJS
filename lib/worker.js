/** Workers library **/ 

//dependencies
const http = require('http');
const https = require('https');
const url = require('url');

const data = require('./data')
const {parseJSON, dateAndTime} = require('../helpers/utilities')
const {sendTwilioSms} = require('../helpers/notifications')


//worker object
const worker = {};


//LOOKUP all the checks
worker.getherAllChecks= ()=>{
    data.list('checks',(error1,checkData)=>{   
        if(!error1 && checkData && checkData.length > 0){
            //read per 'checkData' file using forEach
            checkData.forEach((perCheckData)=>{
                data.read('checks',perCheckData, (error2,orginalChecksData)=>{ 
                    if(!error2 && orginalChecksData){
                        worker.validateCheckData(parseJSON(orginalChecksData)) 
                    }
                    else{
                        console.log('Error: reading one of the checks data')
                    }
                });
            });

        }
        else{
            console.log(`Error: Sorry no check found in 'checks' folder`);
        }
    }); 
};

//validate individual check data
worker.validateCheckData = (orginalChecksData) =>{
    if(orginalChecksData && orginalChecksData.id){

        //validation of the 'state'Up/Down & when 'state' was checked 
        orginalChecksData.state = typeof orginalChecksData.state ==='string' 
        && ['up','down'].indexOf(orginalChecksData.state) > -1 
        ? orginalChecksData.state 
        : 'down';   //default set to 'down'

        orginalChecksData.lastChecked = typeof orginalChecksData.lastChecked === 'string'
        && orginalChecksData.lastChecked.length > 0
        ? orginalChecksData.lastChecked 
        : false; 

        worker.performCheck(orginalChecksData); 
    }
    else{
        console.log('Error: check was invalid or not properly formatted!');
    }
};

// perform check
worker.performCheck = (orginalChecksData) =>{

    //prepare the initial check outcome 
    let checkOutCome = {
        error: false,
        responseStatuseCode:false,
    }; 
    //mark the outcome has not been sent yet
    let outComeSent = false; 


    //parse the hostname & full url from 'orginalChecksData'
    const parsedUrl = url.parse(`${orginalChecksData.protocol}://${orginalChecksData.url}`, true) //'true' include query string
    //extracting from paredUrl
    const hostName = parsedUrl.hostname;  
    const path = parsedUrl.path; //or, const {path} = parsedUrl;
    
    const protocol = `${orginalChecksData.protocol}:`; 
    const method = orginalChecksData.method.toUpperCase(); 
    const timeOut = orginalChecksData.timeoutSeconds * 1000; 

    //construct the request
    const requestDetailsObject = {
        'protocol':protocol,
        'hostname':hostName,
        'method':method,
        'path':path,
        'timeout':timeOut,
    }
    //if user given link is http then 'http' module will be selected otherwise 'https' 
    const protocolToUse = orginalChecksData.protocol === 'http' ? http : https; 

    //Request will hit to the 'google.com' whether he is up/down
    const request = protocolToUse.request(requestDetailsObject,(response)=>{
        //grab the status of Response 
        const status = response.statusCode;
        // console.log(status)  //debugging: google response
        //update the next outcome & pass to the next process
        checkOutCome.responseStatuseCode = status;

        if(!outComeSent){
            worker.processCheckOutCome(orginalChecksData, checkOutCome);
            outComeSent = true; 
        }
        
    });

    //'error' event listener
    request.on('error',(e)=>{
        checkOutCome = {    //update 
            error: true,
            value: e,
        }; 
        //update the next outcome & pass to the next process
        if(!outComeSent){
            worker.processCheckOutCome(orginalChecksData, checkOutCome);
            outComeSent = true; 
        }
        
    }); 

    //'timeout' event listener
    request.on('timeout',()=>{
        checkOutCome = {    //update 
            error: true,
            value: 'timeout',
        };

        //update the next outcome & pass to the next process
        if(!outComeSent){
            worker.processCheckOutCome(orginalChecksData, checkOutCome);
            outComeSent = true; 
        }
    });

    // request send
    request.end();
};

//save check outcome to database and send to next process
worker.processCheckOutCome = (orginalChecksData, checkOutCome)=>{
    //check if checkOutcome 'up' or 'down'
    const state = !checkOutCome.error 
    && checkOutCome.responseStatuseCode 
    && orginalChecksData.successCodes.indexOf(checkOutCome.responseStatuseCode) > -1 
    ? 'up' 
    : 'down'


    const alertWanted = orginalChecksData.lastChecked && orginalChecksData.state !== state ? true : false;
    
    //update the check data
    const newCheckData = orginalChecksData; 

    newCheckData.state = state; 
    newCheckData.lastChecked = dateAndTime();  

    //update the check data to disk
    data.update('checks', newCheckData.id, newCheckData, (err)=>{
        if(!err){
            // console.log('alertWanted:',alertWanted)
            if(alertWanted){
                // send the checkdata to next process
                worker.alertUserToStatusChange(newCheckData)
            }
            else{
                console.log('Alert is not needed as there is no state change!');
            }
        }
        else{
            console.log('Error trying to save check data of one of the checks!');
        }       
    });
}; 

// send notification sms to user if state changes
worker.alertUserToStatusChange = (newCheckData) =>{
    
    const message = `Alert: Your check for ${newCheckData.method.toUpperCase()}
    ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state} at ${dateAndTime()}`;

    sendTwilioSms(newCheckData.userPhone, message, (callbackTrue)=>{
        // console.log('twillo returned:',err)
        if(callbackTrue){
            // console.log(`User was alerted to a state change via mobile SMS:${message}`)
            console.log(`User was alerted via SMS! at [${dateAndTime()}]`)
        }
        else{
            console.log('There was a problem sending sms to one of the user!')
        }
    });
};
 



//This is a timer for execute the worker process once per minute
worker.loop = () =>{
    setInterval(()=>{
        worker.getherAllChecks();
    },2000) //for 1 min
} 

worker.init = ()=>{
    //execute all the checks..
    worker.getherAllChecks(); 
    //call the loop for continuous checking
    worker.loop(); 
}

module.exports = worker; 


