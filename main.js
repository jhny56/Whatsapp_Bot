const mylib = require('./lib');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const { Client, LocalAuth } = require('whatsapp-web.js');
const { captureRejectionSymbol } = require('node-telegram-bot-api');
const client = new Client({
    authStrategy: new LocalAuth()
});
 
const axios = require("axios").default;

const LBtime = {year:0,month:0,day:0,hour:0,minute:0,seconds:0,milliseconds:0,timezone:"",};
mylib.GetTimeZone(LBtime,"Asia/Beirut");
setInterval(() => mylib.GetTimeZone(LBtime,"Asia/Beirut"), 30 * 60 * 1000); //update Beirut time every 30 min the values

const lira = { buy: 0, sell: 0 };
setTimeout(() => mylib.GetLiraRate(lira,LBtime), 2 * 1000);
setInterval(() => mylib.GetLiraRate(lira,LBtime), 10 * 60 * 1000); //update lira every 10 min the values

const Countrytime = {year:0,month:0,day:0,hour:0,minute:0,seconds:0,milliseconds:0,timezone:"",};

var arrayUsers = JSON.parse(fs.readFileSync('Users.txt').toString()); //we should put [] in Users.txt if its empty
function User(phonenumber,firstname,lastname,age){
    this.phonenumber = phonenumber;
    this.firstname = firstname;
    this.lastname = lastname;
    this.age = age;
    this.isSubscribed = false;
    this.countryoption = false;
}
setInterval(() => {
  console.log("the array of users : " , arrayUsers);
}, 30*1000);


client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message',newMessage);

function newMessage(msg){

  let name = msg.from;
  if (msg.notifyName) name = msg.notifyName;
  console.log("you got a new msg from " + name + " : ", msg.body, "\n");

  var phonenumber = msg.from;

  var userindex = mylib.GetUserIndex(arrayUsers,msg.from);
  console.log("The user index for the number :", phonenumber , "is = ", userindex , "\n");

  if (msg.body.toLowerCase() == '/subscribe' ) {
    if (userindex == undefined){
      handleSubscription(phonenumber); return; 
    }
    else{
      client.sendMessage(phonenumber, "Already subscribed on " + phonenumber);
    }
  }
  

  CheckUsersInfo(userindex,arrayUsers,client,phonenumber,msg); //check the user info and ask for misssing ones

  if(arrayUsers[userindex].isSubscribed === true){
    CommandsForSubscribedUsers(msg,client);
  }
  
}

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

  if(userindex != undefined && arrayUsers[userindex].isSubscribed == false){
    console.log("there exist a user object with this phone number");
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
    }
    else if(msg.body.toLowerCase() == "n"){
      arrayUsers.splice(userindex,1);
      fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
      client.sendMessage(phonenumber, "your number is "+ phonenumber +" \n Subscription Canceled.");
      console.log("Canceled subcription \n")
    }

  }

  return;

}

function CommandsForSubscribedUsers(msg,client){


  if (msg.body.toLowerCase() == '/help') { handleHelp(client, msg); return; }

  if (msg.body.toLowerCase() == '/lirarate') { handleLiraRate(client, msg); return; }

  if (msg.body.toLowerCase() == '/countrytimezone' || arrayUsers[userindex].countryoption) {handleCountryTime(client,msg,arrayUsers,userindex); return;}

  return;
}
function handleHelp(client, msg) {
  var MsgCommandArray = ["/LiraRate \n", "/CountryTimeZone \n", "/SendUSDT \n"];
  console.log("Help command initiated \n");
  client.sendMessage(msg.from, "Commands : \n" + MsgCommandArray.toString());
  return;
}
function handleLiraRate(client, msg) {
  console.log("LiraRate command initiated \n");
  client.sendMessage(msg.from, 
`Buy 1 USD for ${lira.buy} LBP
Sell 1 USD for ${lira.sell} LBP`)

  return;
}
function handleCountryTime(client,msg,arrayUsers, userindex){
  client.sendMessage(msg.from, "Which capital do you need? \n command example: Europe/London");
  
  if(arrayUsers[userindex].countryoption = true){
    mylib.GetTimeZone(Countrytime,msg.body);
    setTimeout(() => client.sendMessage(msg.from, "Time in " + Countrytime.timezone + " : " +Countrytime.hour + ":" +Countrytime.minute + ":" + Countrytime.seconds),2*1000);
    arrayUsers[userindex].countryoption = false;
  }else{
    arrayUsers[userindex].countryoption = true;
  }
  
  return
}


client.initialize();

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