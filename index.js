//Initial file to start the Node server & workers
const server = require('./lib/server'); 
const workers = require('./lib/worker'); 

const app = {};

app.init = () =>{
    //start the server 
    server.init();
    //start the worker
    workers.init(); 

}; 
app.init(); //calling 

module.exports = app; 



