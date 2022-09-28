// MY LIBRARIES
const mylib = require('./lib');

//WHATSAPP WEB LIBRARIES
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, ChatTypes,MessageMedia } = require('whatsapp-web.js');
const { captureRejectionSymbol } = require('node-telegram-bot-api');
const client = new Client({
    authStrategy: new LocalAuth()
});

//FILE MANAGER LIBRARIES
const fs = require('fs');
const { randomBytes } = require('crypto');

//AXIOS LIBRARIES
const axios = require("axios").default;

//OBJECTS FOR LIRA RATE
const LBtime = {year:0,month:0,day:0,hour:0,minute:0,seconds:0,milliseconds:0,timezone:"",};
mylib.GetTimeZone(LBtime,"Asia/Beirut");
setInterval(() => mylib.GetTimeZone(LBtime,"Asia/Beirut"), 30 * 60 * 1000); //update Beirut time every 30 min the values
const lira = { buy: 0, sell: 0 };
setTimeout(() => mylib.GetLiraRate(lira,LBtime), 2 * 1000);
setInterval(() => mylib.GetLiraRate(lira,LBtime), 10 * 60 * 1000); //update lira every 10 min the values

//OBJECT FOR COUNTRY TIME
const Countrytime = {year:0,month:0,day:0,hour:0,minute:0,seconds:0,milliseconds:0,timezone:"",};

//OBJECTS FOR USERS
var arrayUsers = JSON.parse(fs.readFileSync('Users.txt').toString()); //we should put [] in Users.txt if its empty
function User(phonenumber,firstname,lastname,age){
    this.phonenumber = phonenumber;
    this.firstname = firstname;
    this.lastname = lastname;
    this.age = age;
    this.isSubscribed = false;
    this.news = [];
    this.option = "";
}

//OBJECTS FOR WORLD NEWS
var ourresponse = {title:"" , text: "",url:"" }
var ourimage = {image : ""}
var allnewsOptions = {
  science : ["Artificial%20Intelligence","Engineers","Biology","Stem%20Cells","science","atoms","bacteria","carbon","galaxy","scientific","scientifically","experiments","scientists"],
  politics : ["Russia","America","Prime%20Minister","President","oil","natural%20gaz"],
  japan: ["japan", "anime", "japanese","tokyo","pokemon"]
}


//READY WHATSAPP CLIENT
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('Client is ready!');
});

//LISTENER TO NEW MESSAGES
client.on('message',OnNewMessage);

// ON NEW MESSAGE
function OnNewMessage(msg){

  // arrayUsers = JSON.parse(fs.readFileSync('Users.txt').toString());

  //get name
  let name = msg.from;
  if (msg.notifyName) name = msg.notifyName;
  console.log("you got a new msg from " + name + " : ", msg.body, "\n");

  //get phone number
  var phonenumber = msg.from;

  //get user index in array
  var userindex = mylib.GetUserIndex(arrayUsers,msg.from);
  console.log("The user index for the number :", phonenumber , "is = ", userindex , "\n");

  //handle subscription if user not registered
  if (msg.body.toLowerCase() == '/subscribe' ) {
    if (userindex == undefined){
      handleSubscription(phonenumber); return;  //Add phone number to user arrays
    }
    else{
      client.sendMessage(phonenumber, "Already subscribed on " + phonenumber);
    }
  }
  
  if(userindex != undefined && arrayUsers[userindex].isSubscribed == false){
    console.log("there exist a user object with this phone number");
    CheckUsersInfo(userindex,arrayUsers,client,phonenumber,msg); //check the user info and ask for missing ones
  }

  //handle the commands of subscribed users
  if(arrayUsers[userindex].isSubscribed === true){
    handleUserOption(client,msg,arrayUsers,userindex);
    CommandsForSubscribedUsers(msg,client, arrayUsers,userindex);
  }
  
}

// For Subscription
function handleSubscription(phonenumber){

  var userindex = mylib.GetUserIndex(arrayUsers,phonenumber);
  console.log("Checking if the phone number exist in our Array : UserIndex = ", userindex,"\n");
  if(!userindex){
    console.log("the phone number does not exist in the array \n");
    arrayUsers.push(new User(phonenumber));
    console.log("Object User is created with a phone number :" ,phonenumber,"\n");
  }
  userindex = mylib.GetUserIndex(arrayUsers,phonenumber);
  console.log("The user index for the number :", phonenumber , "is = ", userindex , "\n");

  console.log("there does not exist a first name for :" , arrayUsers[userindex], "\n");
  client.sendMessage(phonenumber, "your number is "+ phonenumber +" \nPlease send your firstname.");

  fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));

  console.log("Handle subscription function is finished \n");
  return;

}
function CheckUsersInfo(userindex,arrayUsers,client,phonenumber,msg){

 
    if(!arrayUsers[userindex].firstname ){
      if(mylib.checkIfname(msg.body)){
        arrayUsers[userindex].firstname = msg.body;
        fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
        console.log("we got our first name \n :" ,msg.body);
        console.log("there does not exist a last name for :" , arrayUsers[userindex], "\n");
        client.sendMessage(phonenumber, "your number is "+ phonenumber +" \nPlease send your lastname.");
        
      }
      else{
        client.sendMessage(phonenumber, "your number is "+ phonenumber +" \nPlease send your fisrtname. \n there cannot be numbers or symboles in it");
        return;
      }
    }
    else if(!arrayUsers[userindex].lastname){
      if(mylib.checkIfname(msg.body)){
        arrayUsers[userindex].lastname = msg.body;
        fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
        console.log("we got our last name \n :" ,msg.body);
        client.sendMessage(phonenumber, "your number is "+ phonenumber +" \nPlease send your age.");
        
      }
      else{
        client.sendMessage(phonenumber, "your number is "+ phonenumber +" \nPlease send your lastname. \n there cannot be numbers or symboles in it");
        return;
      }
    }
    else if(!arrayUsers[userindex].age){
      if(mylib.checkIfage(msg.body)){
        arrayUsers[userindex].age = msg.body;
        fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
        console.log("we got our last name \n :" ,msg.body);
        client.sendMessage(phonenumber, "your number is "+ phonenumber +" \nDo you confirm subscription ? (Y/N)" + JSON.stringify(arrayUsers[userindex],null,2));
      }
      else{
        client.sendMessage(phonenumber, "your number is "+ phonenumber +" \nPlease send your age. \n it needs to be an integer between 12 and 100");
        return;
      }
    }
    else if(!arrayUsers[userindex].isSubscribed && msg.body.toLowerCase() == "y"){
      arrayUsers[userindex].isSubscribed = true;
      fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
      client.sendMessage(phonenumber, "Subscription with phone : " + arrayUsers[userindex].phonenumber+ "\n first name : " + arrayUsers[userindex].firstname + "\n lastname : " + arrayUsers[userindex].lastname + "\n age : " + arrayUsers[userindex].age +"\n Completed !");
      console.log("all the requirement are met so Is subscribed is = true \n");
      arrayUsers[userindex].option = ""
    }
    else if(msg.body.toLowerCase() == "n"){
      arrayUsers.splice(userindex,1);
      fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
      client.sendMessage(phonenumber, "your number is "+ phonenumber +" \n Subscription Canceled.");
      console.log("Canceled subcription \n")
      arrayUsers[userindex].option = ""
    }

  

  return;

}

//For Subscribed Users
function handleUserOption(client,msg,arrayUsers,userindex){
  if (msg.body.toLowerCase() == '/help') { arrayUsers[userindex].option = "/help"; return; }

  if (msg.body.toLowerCase() == '/lirarate') { arrayUsers[userindex].option = "/lirarate"; return; }

  if (msg.body.toLowerCase() == '/countrytimezone' ) {arrayUsers[userindex].option = "/countrytimezone"; return;}

  if (msg.body.toLowerCase() == '/mynews') { arrayUsers[userindex].option = "/mynews"; return; }

  if (msg.body.toLowerCase() == '/addnews') { arrayUsers[userindex].option = "/addnews"; return; }
  if (msg.body.toLowerCase() == '/removenews') { arrayUsers[userindex].option = "/removenews"; return; }

  return;
}
function CommandsForSubscribedUsers(msg,client,arrayUsers,userindex){


  if (arrayUsers[userindex].option == "/help") { handleHelp(client, msg ,arrayUsers,userindex); return; }

  if (arrayUsers[userindex].option == "/lirarate") { handleLiraRate(client, msg ,arrayUsers,userindex); return; }

  if (arrayUsers[userindex].option == "/countrytimezone" ) {handleCountryTime(client,msg,arrayUsers,userindex); return;}

  if (arrayUsers[userindex].option == "/mynews") { handleMyNews(client, msg ,arrayUsers,userindex); return; }

  if (arrayUsers[userindex].option == "/addnews") { handleAddnews(client, msg ,arrayUsers,userindex); return; }
  if (arrayUsers[userindex].option == "/removenews") { handleRemovenews(client, msg ,arrayUsers,userindex); return; }

  return;
}
function handleHelp(client, msg ,arrayUsers,userindex) {
  var MsgCommandArray = ["/LiraRate \n", "/CountryTimeZone \n", "/AddNews \n", "/MyNews \n"];
  console.log("Help command initiated \n");
  client.sendMessage(msg.from, "Commands : \n" + MsgCommandArray.toString());
  arrayUsers[userindex].option = "";
  return;
}
function handleLiraRate(client, msg ,arrayUsers,userindex) {
  console.log("LiraRate command initiated \n");
  client.sendMessage(msg.from, 
`Buy 1 USD for ${lira.buy} LBP
Sell 1 USD for ${lira.sell} LBP`)

arrayUsers[userindex].option = "";

  return;
}
async function handleCountryTime(client,msg,arrayUsers, userindex){
  
  
  if(msg.body.toLowerCase() != "/countrytimezone"){
    if(await CheckForCountry(msg.body)){
    await mylib.GetTimeZone(Countrytime,msg.body);
    client.sendMessage(msg.from, "Time in " + Countrytime.timezone + " : " +Countrytime.hour + ":" +Countrytime.minute + ":" + Countrytime.seconds);
    arrayUsers[userindex].option = "";
    }
    else{
      client.sendMessage(msg.from, "Input inccorrect \n command example: Europe/London");
    }
  }
  else{
    client.sendMessage(msg.from, "Which capital do you need? \n command example: Europe/London");
  }
  
  return
}
async function CheckForCountry(location){

  return await mylib.axiosTimeApi(location) //return false if there is an error in location
}

async function handleMyNews(client, msg ,arrayUsers,userindex){

  var randomSubject = arrayUsers[userindex].news[parseInt( Math.random() * (arrayUsers[userindex].news.length ) )] //maths random give value between 0 and 1
  console.log("random subject : ", randomSubject);

  var randomWord = allnewsOptions[randomSubject][parseInt( Math.random() * (allnewsOptions[randomSubject].length ) )];
  console.log("random word : ", randomWord);

  await mylib.GetWorldNews(ourresponse,ourimage,randomWord);
  try{
    const media = await MessageMedia.fromUrl(ourimage.image);
    await client.sendMessage(msg.from,media);
  }catch{
    console.log("could not download image");
  }
  await client.sendMessage(msg.from,JSON.stringify(ourresponse.title,null,2) +"\n\n" + JSON.stringify(ourresponse.text,null,2) +"\n\n"  +JSON.stringify(ourresponse.url,null,2) +"\n\n");
  arrayUsers[userindex].option = "";
}

function handleAddnews(client, msg ,arrayUsers,userindex){

console.log("Handeling add news initiated");

  if(msg.body.toLowerCase() != "/addnews"){
    if(msg.body.toLowerCase() == "cancel"){
      console.log("option = empty ");
      arrayUsers[userindex].option = "";
      return
    }
    else if(Object.keys(allnewsOptions).includes(msg.body.toLowerCase()) && !arrayUsers[userindex].news.includes(msg.body) ){
      arrayUsers[userindex].news.push(msg.body.toLowerCase());
      fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
      client.sendMessage(msg.from,"your news : " + JSON.stringify(arrayUsers[userindex].news));
    }
    else{
      client.sendMessage(msg.from,"no available news option for this subject");
    }
  }  
  else{
    client.sendMessage(msg.from,"Available news option : " + JSON.stringify(Object.keys(allnewsOptions),null,2));
    client.sendMessage(msg.from,"your news : " + JSON.stringify(arrayUsers[userindex].news));
  }

}
function handleRemovenews(client, msg ,arrayUsers,userindex){

  console.log("Handeling remove news initiated");
  
    if(msg.body.toLowerCase() != "/removenews"){
      if(msg.body.toLowerCase() == "cancel"){
        console.log("option = empty ");
        arrayUsers[userindex].option = "";
        return
      }
      else if(arrayUsers[userindex].news.includes(msg.body.toLowerCase()) ){
        
        arrayUsers[userindex].news.splice(arrayUsers[userindex].news.indexOf(msg.body),1); //indexof give index of where the msg exist in the array
        fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
        client.sendMessage(msg.from,"your news : " + JSON.stringify(arrayUsers[userindex].news));
      }
      else{
        client.sendMessage(msg.from,"no available news option for this subject");
      }
    }  
    else{
      client.sendMessage(msg.from,"your news : " + JSON.stringify(arrayUsers[userindex].news));
    }
  
  }

client.initialize();

setInterval(() => {
  console.log("the array of users : " , arrayUsers);
}, 30*1000);

let ExampleMsg =  {
    _data: {
      id: {
        fromMe: false,
        remote: '96181688898@c.us',
        id: '3EB0A17F1513B0C37ACF',
        _serialized: 'false_96181688898@c.us_3EB0A17F1513B0C37ACF'
      },
      body: 'hi',
      type: 'chat',
      t: 1662585905,
      notifyName: 'TedZ',
      from: '96181688898@c.us',
      to: '96176508354@c.us',
      self: 'in',
      ack: 1,
      isNewMsg: true,
      star: false,
      kicNotified: false,
      recvFresh: true,
      isFromTemplate: false,
      pollInvalidated: false,
      broadcast: false,
      mentionedJidList: [],
      isVcardOverMmsDocument: false,
      isForwarded: false,
      hasReaction: false,
      ephemeralOutOfSync: false,
      productHeaderImageRejected: false,
      lastPlaybackProgress: 0,
      isDynamicReplyButtonsMsg: false,
      isMdHistoryMsg: false,
      requiresDirectConnection: false,
      pttForwardedFeaturesEnabled: true,
      isEphemeral: false,
      isStatusV3: false,
      links: []
    },
    mediaKey: undefined,
    id: {
      fromMe: false,
      remote: '96181688898@c.us',
      id: '3EB0A17F1513B0C37ACF',
      _serialized: 'false_96181688898@c.us_3EB0A17F1513B0C37ACF'
    },
    ack: 1,
    hasMedia: false,
    body: 'hi',
    type: 'chat',
    timestamp: 1662585905,
    from: '96181688898@c.us',
    to: '96176508354@c.us',
    author: undefined,
    deviceType: 'web',
    isForwarded: false,
    forwardingScore: 0,
    isStatus: false,
    isStarred: false,
    broadcast: false,
    fromMe: false,
    hasQuotedMsg: false,
    duration: undefined,
    location: undefined,
    vCards: [],
    inviteV4: undefined,
    mentionedIds: [],
    orderId: undefined,
    token: undefined,
    isGif: false,
    isEphemeral: false,
    links: []
  }