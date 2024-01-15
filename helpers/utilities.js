const crypto = require('crypto');

const utilities = {};
const environments = require('./environments');

// parse JSON string to Object
utilities.parseJSON = (jsonString) => {
    let output;

    try {
        output = JSON.parse(jsonString);
    } catch {
        output = {};
    }

    return output;
};

// hash string
utilities.hash = (str) => {
    if (typeof str === 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', environments.secretKey)
        .update(str)
        .digest('hex');
        return hash;
    }
    return false;
};

//Random token string generator
utilities.createRandomStr = (strLength)=>{
    //strLength validity check 
    let length  = typeof strLength === 'number'&& strLength>0 ? strLength : false; 
    
    let output =''; 
    if(length){
        const possibleChar = 'abcdefghijklmnopABCDEFGHIJKLMNOP0123456789';
        for(let i=0; i<length; i++){
            let randomChar = possibleChar.charAt(Math.floor(Math.random()*possibleChar.length))
            output+=randomChar; 
        }
        return output;   
    }
    else{
        return false; 
    }
    
}

utilities.dateAndTime = () =>{
    // Create a Date object representing the current date and time
    var currentDate = new Date();

    // Get individual components
    var year = currentDate.getFullYear();
    var month = currentDate.getMonth() + 1; // Months are zero-based, so add 1
    var day = currentDate.getDate();
    var hours = currentDate.getHours();
    var minutes = currentDate.getMinutes();
    var seconds = currentDate.getSeconds();

    // Determine AM or PM
    var ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert 24-hour time to 12-hour time
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours) as 12 AM

    // Format the date as a string in the desired format
    var formattedDate = hours + ':' + (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds + ' ' + ampm  +' '+ day + '-' + month + '-' + year;

    // Display the formatted date
    return formattedDate;

}

module.exports = utilities;
