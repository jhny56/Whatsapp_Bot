const axios = require("axios").default;

module.exports = {
    GetLiraRate,
    GetTimeZone,
    checkIfname,
    checkIfage,
    GetUserIndex,
    axiosTimeApi,
    GetWorldNews,
    
}

//LIRA RATE API
async function axiosLiraRate(time){
    try{
        response_Lira = await axios.get('https://lirarate.org/wp-json/lirarate/v2/all?currency=LBP&_ver=t'+time.year.toString()+time.month.toString()+time.day.toString()+time.hour.toString());  
        console.log("Request Completed -LiraRate");     
    }
    catch(err){
        response_Lira = await axiosLiraRate(time);
        return response_Lira.data;
    }

return response_Lira.data;
}
function GetLiraRate(lira,time){
    axiosLiraRate(time).then(response_Lira => {
        lira.buy = response_Lira.lirarate.buy[response_Lira.lirarate.buy.length - 1][1];
        lira.sell = response_Lira.lirarate.sell[response_Lira.lirarate.sell.length - 1][1];

        console.log("Lira Rate Buy/Sell Updated : " , lira );
    }).catch(err => {
        console.log(err);
    })
    
}    

//TIME ZONE API
async function axiosTimeApi(location){
    try{
        response_Time = await axios.get('https://timeapi.io/api/Time/current/zone?timeZone=' + location); 

        console.log("Request Completed -TimeAPI");
        return response_Time.data
    }
    catch(err){
        console.log("Error in time api : " ,err);       
        return false;
    }


}
async function GetTimeZone(time,location){
    console.log("Get TimeZone command initiated \n");
    await axiosTimeApi(location).then(response_Time => {
        time.year = response_Time.year;
        time.month = response_Time.month;
        time.day = response_Time.day;
        time.hour = response_Time.hour;
        time.minute = response_Time.minute;
        time.seconds = response_Time.seconds;
        time.milliseconds = response_Time.milliSeconds;
        time.timezone = response_Time.timeZone;

        console.log("Time Updated for " + location + " Time : " , time);
        return true;
    }).catch(err => {
        return false;
    })
    
}    

//WORLD NEWS API
async function axiosWorldNewsApi(randomWord){
    try{
        response_News = await axios.get(" https://api.worldnewsapi.com/search-news?api-key=4ddc4ad182c048d089c5ba1131cb8cb9&number=10&text=" + randomWord + "." ); 
        console.log("Request Completed -NewsApi");
    }
    catch(err){
        console.log("Error in news api : " ,err);       
        return false;
    }
    return response_News;
}
async function GetWorldNews(ourresponse,ourimage,randomWord){
    console.log("Get world news command initiated \n");

    await axiosWorldNewsApi(randomWord).then(response_News => {
        
        randomNewsIndex = parseInt(Math.random() * response_News.data.news.length);

        ourresponse.title = response_News.data.news[randomNewsIndex].title;
        var count = 0;
        var ourtext = "";

        for(var i = 0; i<response_News.data.news[randomNewsIndex].text.length;i++){
            ourtext += response_News.data.news[randomNewsIndex].text[i];
            if(response_News.data.news[randomNewsIndex].text[i] == "." && response_News.data.news[randomNewsIndex].text[i+1] == " " ){
                count++;
            }
            if(count >2){
                break;
            }
        }

        ourresponse.text = ourtext;
        ourresponse.url = response_News.data.news[randomNewsIndex].url;
        ourimage.image = response_News.data.news[randomNewsIndex].image;
        console.log(JSON.stringify(ourresponse,null,2));
        console.log(JSON.stringify(ourimage,null,2));
        
    }).catch(err => {
        console.log(err)
    })
    
} 


//CHECKING REGEX FOR NAME AND AGE
function checkIfname(name){
    for(var i = 0;i<name.length;i++){
      if (! /^[a-zA-Z]+$/.test(name[i])) { // if there is a character that is not between a-z and A-Z /^[a-zA-Z]+$/.test(name[i]) will return true
        return false
      }
    }
    return true;
}
function checkIfage(age){
    if(age % 1 == 0 && age>=12 && age <=100){
        return true;
    }
    return false;
}
  
//GET USER INDEX IN ARRAY
function GetUserIndex(arrayUsers,phonenumber){
    for(var i = 0; i<arrayUsers.length ; i++){
        if(arrayUsers[i].phonenumber ==phonenumber ){
            return i;
        }
    }
}

