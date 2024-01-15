const handler = {}

handler.notFoundHandler = (requestProperties,callback) =>{
  console.log(requestProperties);
  callback(404,{
    message:'Your request URL was not found', 
  })
}
module.exports = handler; 