//dependencies
const url = require('url')
const {StringDecoder} = require('string_decoder'); //StringDecoder is a Class

const routes = require('../routes')
const {notFoundHandler} = require('../handlers/routeHandlers/notFoundHandler')
const {parseJSON} = require('./utilities')

const handler ={}

handler.handleRequestResponse = (request, response) =>{
    //Request handling (Server end)
    //get the request and Parsed it
    const parsedUrl = url.parse(request.url, true) 
    const path = parsedUrl.pathname  

    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    // console.log(trimmedPath) //output: 'about'
    const method = request.method.toLowerCase() //we got method whether big or small letter.

    const queryStringObject = parsedUrl.query;
    const headersObjects = request.headers
    // console.log(headersObjects)

    const requestProperties = {
        parsedUrl,
        path,
        trimmedPath,
        method,
        queryStringObject,
        headersObjects,
    }


    const decoder = new StringDecoder('utf-8') 
    let realData =''; 

    const chosenHandler = routes[trimmedPath] ? routes[trimmedPath] : notFoundHandler;
    
    // Event listener for the 'response' event

    request.on('data', (buffer)=>{ // A chunk of data
        realData += decoder.write(buffer)
    })
    //when buffer finished 'end' event fired on the request..
    request.on('end', ()=>{       // The whole data
        realData += decoder.end()

        //client Request er body te new user er information (json) dia create korbe 
        //here,realData is a string so,we have to convert it to valid javascript 
        //object by using JSON.parse.
        //if clients input json is not valid,then problem may occur,so need to check
        //input json is vaild or not.//so Handling this type of error we use 'utilities.js'
        requestProperties.body = parseJSON(realData)


        chosenHandler(requestProperties,(statusCode, responsePayload)=>{
            //Input validation for 'statusCode'
            statusCode = typeof statusCode === 'number' ? statusCode : 500; 
            responsePayload = typeof responsePayload ==='object' ? responsePayload : {}; //request payload or request body
    
            //JSON string akare server theke data ber hobe
            const payloadString = JSON.stringify(responsePayload); 
    
            //Return the response from server to client.... 
            response.setHeader('Content-Type','application/json')
            response.writeHead(statusCode); 
            //writeHead() method is used to send the HTTP response headers 
            //to the client before the actual response body (payloadString) is sent.
            response.end(payloadString); //Output:{"message":"A sample url"}
        });
    });
};

module.exports = handler; 