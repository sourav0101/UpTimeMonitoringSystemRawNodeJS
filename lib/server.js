//Server library

//dependencies
const http = require('http'); 
const {handleRequestResponse} = require('../helpers/handleRequestResponse')
const environments = require('../helpers/environments')

const server = {}; 

//create the server of application
server.createServer = () =>{
    const createServerVar = http.createServer(server.handleRequestResponse); 
    createServerVar.listen(environments.port,()=>{
        console.log(`Listening to port ${environments.port}...`);
    });
}
//handle request and response
server.handleRequestResponse = handleRequestResponse;

//start the server //invoke 
server.init = ()=>{
    server.createServer()
}

module.exports = server; 