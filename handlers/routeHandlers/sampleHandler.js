const handler = {}

handler.sampleHandler = (requestProperties,callback) =>{
  console.log(requestProperties);
  callback(200,{
    message:'A sample url', 
  })
}
module.exports = handler; 