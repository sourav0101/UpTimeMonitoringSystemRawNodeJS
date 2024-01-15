//handle all environment related things

const environments = {}; 

environments.staging = {
    port:3000,
    envName:'staging',
    secretKey:'gegegegege',
    maxCheckes : 5,  //max Checkes only 5
    twilio :{
        fromPhone:'+15064975129',
        accountSid:'ACc4cfc0d21553f4107624a44bc1f0b3d0',
        authToken:'ba5a30b4fa0351e3878c19d47d573570',
    }
}
environments.production = {
    port:4000,
    envName:'production', 
    secretKey:'efefefefefe',
    twilio :{
        fromPhone:'+15064975129',
        accountSid:'ACc4cfc0d21553f4107624a44bc1f0b3d0',
        authToken:'ba5a30b4fa0351e3878c19d47d573570',
    }  
}

//determine which environment was passed [from CMD line]...
const currEnvironment = typeof process.env.NODE_ENV === 'string' 
? process.env.NODE_ENV
:'staging'; //production or staging string selection

//export the corrsponding environment object... [staging or production object]
const environmentsToExport = typeof environments[currEnvironment] === 'object'
? environments[currEnvironment]
:environments.staging;


module.exports = environmentsToExport; 


