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
var newsResponse = {title:"" , text: "",url:"" }
var newsImage = {image : ""}
var allnewsOptions = {
  science : ["Artificial%20Intelligence","Engineers","Biology","Stem%20Cells","science","atoms",
            "bacteria","carbon","galaxy","scientific","scientifically","experiments","scientists",
            ],
  politics : ["army","war","Prime%20Minister","President","oil","natural%20gaz"],
  japan: ["japan", "anime", "japanese","tokyo","pokemon",]
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

  //get phone number and message
  var phonenumber = msg.from;
  var userMessage = msg.body;

  console.log("you got a new msg from " + phonenumber + " : ", userMessage, "\n");

  //get user index in array
  var userindex = mylib.GetUserIndex(arrayUsers,phonenumber);
  console.log("The user index for the number :", phonenumber , "is = ", userindex , "\n");

  //handle subscription if user not registered
  if (userMessage.toLowerCase() == '/sub') {
    if (userindex == undefined){
      handleSubscription(arrayUsers,userindex,phonenumber); return;  //Add phone number to user arrays
    }
    else{
      client.sendMessage(phonenumber, "Already subscribed on " + phonenumber);
    }
  }
  
  if(arrayUsers[userindex].option == "/sub"){
    console.log("there exist a user object with this phone number");
    //check the user info and ask for missing ones
    CheckUsersInfo(arrayUsers,userindex,phonenumber,userMessage);
  }

  //handle the commands of subscribed users
  if(arrayUsers[userindex].isSubscribed == true){
    console.log("handeling subscribed users")
    handleUserOption(arrayUsers,userindex,userMessage);
    CommandsForSubscribedUsers(arrayUsers,userindex,phonenumber,userMessage);
  }
  
}

// For Subscription
function handleSubscription(arrayUsers,userindex,phonenumber){
  
  console.log("the phone number does not exist in the array \n");
  
  //added the new user
  arrayUsers.push(new User(phonenumber));
  fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
  console.log("Object User is created with a phone number :" ,phonenumber,"\n");

  //get the user index
  userindex = mylib.GetUserIndex(arrayUsers,phonenumber);
  console.log("The user index for the number :", phonenumber , "is = ", userindex , "\n");

  arrayUsers[userindex].option = "/sub";

  client.sendMessage(phonenumber, "your number is "+ phonenumber +" \nPlease send your firstname lastname age.\n Ex : Elie-joe Hajj 19");

  console.log("Handle subscription function is finished \n");
  return;

}

function CheckUsersInfo(arrayUsers,userindex,phonenumber,userMessage){

  if(!arrayUsers[userindex].firstname && !arrayUsers[userindex].lastname && !arrayUsers[userindex].age){
    userMessage = ArraySplitUserInput(userMessage);
    if(userMessage.length > 3){client.sendMessage(phonenumber,"argument bigger than requested"); return;}

    let firstname = userMessage[0];
    let lastname = userMessage[1];
    let age = userMessage[2];

    console.log("array of usermessage = ", firstname , lastname , age);

    let firstnameerror;
    let lastnameerror;
    let ageerror;

    let errorSendMessage;

    if(!mylib.checkIfname(firstname)) {firstnameerror = "No symbole or number in firstname\n"};
    if(!mylib.checkIfname(lastname)){lastnameerror = "No symbole or number in lastname\n"};
    if(!mylib.checkIfage(age)){ageerror = "age must be between 12 and 100\n"};
    errorSendMessage = firstnameerror + lastnameerror + ageerror;
    if(errorSendMessage){client.sendMessage(phonenumber,errorSendMessage); return;};

    arrayUsers[userindex].firstname = firstname;
    arrayUsers[userindex].lastname = lastname;
    arrayUsers[userindex].age = age;

    client.sendMessage(phonenumber,
    `your phone number is ${phonenumber} Do you confirm subscription ? (Y/N) 
    phone : ${arrayUsers[userindex].phonenumber} 
    firstname : ${arrayUsers[userindex].firstname}
    lastname : ${arrayUsers[userindex].lastname}
    age : ${arrayUsers[userindex].age} `
    );
  }
  else if(!arrayUsers[userindex].isSubscribed && userMessage.toLowerCase() == "y"){
    arrayUsers[userindex].isSubscribed = true;
    arrayUsers[userindex].option = "";
    fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
    
    client.sendMessage(phonenumber, `Subscription Completed`);
    console.log("all the requirement are met so Is subscribed is = true \n");

    return
  }
  else if(userMessage.toLowerCase() == "n"){
    arrayUsers.splice(userindex,1);
    arrayUsers[userindex].option = "";
    fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));

    client.sendMessage(phonenumber, "Subscription Canceled.");
    console.log("Canceled subcription \n");
   
    return
  }

  console.log("Check user info finished \n")
  return;

}

//For Subscribed Users
function handleUserOption(arrayUsers,userindex,userMessage){
  if (userMessage.toLowerCase() == '/quit') { arrayUsers[userindex].option = ""; return; }
  if (userMessage.toLowerCase() == '/help') { arrayUsers[userindex].option = "/help"; return; }

  if (userMessage.toLowerCase() == '/lirarate') { arrayUsers[userindex].option = "/lirarate"; return; }

  if (userMessage.toLowerCase() == '/countrytimezone' ) {arrayUsers[userindex].option = "/countrytimezone"; return;}

  if (userMessage.toLowerCase() == '/mynews') { arrayUsers[userindex].option = "/mynews"; return; }

  if (userMessage.toLowerCase() == '/addnews') { arrayUsers[userindex].option = "/addnews"; return; }
  if (userMessage.toLowerCase() == '/removenews') { arrayUsers[userindex].option = "/removenews"; return; }


  return;
}
function CommandsForSubscribedUsers(arrayUsers,userindex,phonenumber,userMessage){


  if (arrayUsers[userindex].option == "/help") { handleHelp(arrayUsers,userindex,phonenumber); return; }

  if (arrayUsers[userindex].option == "/lirarate") { handleLiraRate(arrayUsers,userindex,phonenumber); return; }

  if (arrayUsers[userindex].option == "/countrytimezone" ) {handleCountryTime(phonenumber,userMessage); return;}

  if (arrayUsers[userindex].option == "/mynews") { handleMyNews(arrayUsers,userindex,phonenumber); return; }

  if (arrayUsers[userindex].option == "/addnews") { handleAddnews(arrayUsers,userindex,phonenumber,userMessage); return; }
  if (arrayUsers[userindex].option == "/removenews") { handleRemovenews(arrayUsers,userindex,phonenumber,userMessage); return; }

  return;
}
function handleHelp(arrayUsers,userindex,phonenumber) {
  var MsgCommandArray = ["/Cancel :to quit any operation","/LiraRate \n", "/CountryTimeZone \n", "/AddNews \n", "/MyNews \n"];
  console.log("Help command initiated \n");

  client.sendMessage(phonenumber, "Commands : \n" + MsgCommandArray.toString());
  arrayUsers[userindex].option = "";
  return;
}
function handleLiraRate(arrayUsers,userindex,phonenumber) {
  console.log("LiraRate command initiated \n");

  client.sendMessage(phonenumber, 
  `Buy 1 USD for ${lira.buy} LBP
  Sell 1 USD for ${lira.sell} LBP`
  );

  arrayUsers[userindex].option = "";
  return;
}
async function handleCountryTime(phonenumber,userMessage){
  
  
  if(userMessage.toLowerCase() != "/countrytimezone"){
    if(await mylib.axiosTimeApi(userMessage)){
      await mylib.GetTimeZone(Countrytime,userMessage);
      client.sendMessage(phonenumber, "Time in " + Countrytime.timezone + " : " +Countrytime.hour + ":" +Countrytime.minute + ":" + Countrytime.seconds);
    }
    else{
      client.sendMessage(phonenumber, "Input inccorrect \n command example: Europe/London");
    }
  }
  else{
    client.sendMessage(phonenumber, "Which capital do you need? \n command example: Europe/London");
  }
  
  return
}

async function handleMyNews(arrayUsers,userindex,phonenumber){
  try{
    var randomSubject = arrayUsers[userindex].news[parseInt( Math.random() * (arrayUsers[userindex].news.length ) )] //maths random give value between 0 and 1
    console.log("random subject : ", randomSubject);

    var randomWord = allnewsOptions[randomSubject][parseInt( Math.random() * (allnewsOptions[randomSubject].length ) )];
    console.log("random word : ", randomWord);
  
    await mylib.GetWorldNews(newsResponse,newsImage,randomWord);
    try{
      const media = await MessageMedia.fromUrl(newsImage.image);
      await client.sendMessage(phonenumber,media);
    }catch{
      console.log("could not download image");
    }
    await client.sendMessage(phonenumber,JSON.stringify(newsResponse.title,null,2) +"\n\n" + JSON.stringify(newsResponse.text,null,2) +"\n\n"  +JSON.stringify(newsResponse.url,null,2) +"\n\n");
    arrayUsers[userindex].option = "";
  }
  catch
  {
    client.sendMessage(phonenumber,"You have no news.")
  }
}

function handleAddnews(arrayUsers,userindex,phonenumber,userMessage){

  console.log("Handeling add news initiated");


  if(userMessage.toLowerCase() != "/addnews"){

    let invalidOptions = [];
    userMessage = ArraySplitUserInput(userMessage);

    for(let i = 0 ; i < userMessage.length ; i++){

      if(Object.keys(allnewsOptions).includes(userMessage[i].toLowerCase()) && !arrayUsers[userindex].news.includes(userMessage[i].toLowerCase()) ){
        arrayUsers[userindex].news.push(userMessage[i].toLowerCase());
      }
      else{
        console.log(userMessage[i], " could not be added");
        invalidOptions.push(userMessage[i]);
      }
      console.log(i);
    }

    console.log("invalid option : ", invalidOptions);

    fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
    if(invalidOptions[0] != undefined){client.sendMessage(phonenumber,invalidOptions.toString() +  "could not be added")};
    client.sendMessage(phonenumber,"your news : " + JSON.stringify(arrayUsers[userindex].news));
  }
  else{
    client.sendMessage(phonenumber,
    `Available news option : ${JSON.stringify(Object.keys(allnewsOptions),null,2)}
    your news : ${JSON.stringify(arrayUsers[userindex].news)} 
    Write the subjects you want to add, ex : Science politcs japan`
    );
  }
  
}

function handleRemovenews(arrayUsers,userindex,phonenumber,userMessage){

  console.log("Handeling remove news initiated");


  if(userMessage.toLowerCase() != "/removenews"){

    userMessage = ArraySplitUserInput(userMessage);

    for(var i = 0 ; i < userMessage.length ; i++){
      if(arrayUsers[userindex].news.includes(userMessage[i].toLowerCase())){
        arrayUsers[userindex].news.splice(arrayUsers[userindex].news.indexOf(userMessage[i].toLowerCase()),1); //indexof give index of where the msg exist in the array
      }
    }

    fs.writeFileSync('Users.txt',JSON.stringify(arrayUsers,null,2));
    client.sendMessage(phonenumber,"your news : " + JSON.stringify(arrayUsers[userindex].news));
  }
  else{
    client.sendMessage(phonenumber,
    `your news : ${JSON.stringify(arrayUsers[userindex].news)}
    Write the subjects you want to remove, ex : Science politcs japan`
    );
  }
  
}

function ArraySplitUserInput(userMessage){
  userMessage = userMessage.split(" ");
  return userMessage;
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