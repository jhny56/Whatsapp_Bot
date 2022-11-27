// MY LIBRARIES
const mylib = require("./lib");
const mytables = require("./sequelize");

//WHATSAPP WEB LIBRARIES
const qrcode = require("qrcode-terminal");
const {
  Client,
  // LocalAuth,
  // ChatTypes,
  MessageMedia,
} = require("whatsapp-web.js");
// const { captureRejectionSymbol } = require("node-telegram-bot-api");
const client = new Client();
//   {
//   authStrategy: new LocalAuth(),
// }

//AXIOS LIBRARIES
const axios = require("axios").default;

//OBJECTS FOR LIRA RATE
const LBtime = {
  year: 0,
  month: 0,
  day: 0,
  hour: 0,
  minute: 0,
  seconds: 0,
  milliseconds: 0,
  timezone: "",
};
mylib.GetTimeZone(LBtime, "Asia/Beirut");
setInterval(() => mylib.GetTimeZone(LBtime, "Asia/Beirut"), 30 * 60 * 1000); //update Beirut time every 30 min the values
const lira = { buy: 0, sell: 0 };
setTimeout(() => mylib.GetLiraRate(lira, LBtime), 2 * 1000);
setInterval(() => mylib.GetLiraRate(lira, LBtime), 10 * 60 * 1000); //update lira every 10 min the values

//OBJECT FOR COUNTRY TIME
const Countrytime = {
  year: 0,
  month: 0,
  day: 0,
  hour: 0,
  minute: 0,
  seconds: 0,
  milliseconds: 0,
  timezone: "",
};

//OBJECTS FOR WORLD NEWS
var newsResponse = { title: "", text: "", url: "" };
var newsImage = { image: "" };
var allnewsOptions = {
  science: [
    "Artificial%20Intelligence",
    "Engineers",
    "Biology",
    "Stem%20Cells",
    "science",
    "atoms",
    "bacteria",
    "carbon",
    "galaxy",
    "scientific",
    "scientifically",
    "experiments",
    "scientists",
  ],
  politics: [
    "army",
    "war",
    "Prime%20Minister",
    "President",
    "oil",
    "natural%20gaz",
  ],
  japan: ["japan", "anime", "japanese", "tokyo", "pokemon"],
};

//READY WHATSAPP CLIENT
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

//LISTENER TO NEW MESSAGES
client.on("message", OnNewMessage);

//--------------------------------------------------------------------------------------------

// ON NEW MESSAGE
async function OnNewMessage(msg) {
  //get phone number and message
  var phonenumber = msg.from;
  var userMessage = msg.body.toLowerCase();

  console.log(
    "you got a new msg from " + phonenumber + " : ",
    userMessage,
    "\n"
  );

  if (!(await mytables.userExist(phonenumber))) {
    if (userMessage.toLowerCase() == "/sub") {
      await handleSubscription(phonenumber);
      return; //Add phone number to user arrays
    } else {
      client.sendMessage(phonenumber, "You need to subscribe first, send /sub");
    }
  } else {
    if ((await mytables.getUserInfo(phonenumber, "option")) == "/sub") {
      console.log("there exist a user object with this phone number");
      //check the user info and ask for missing ones
      CheckUsersInfo(phonenumber, userMessage);
    }

    if (
      userMessage.toLowerCase() == "/sub" &&
      (await mytables.getUserInfo(phonenumber, "subscribed"))
    ) {
      client.sendMessage(phonenumber, "Already subscribed on " + phonenumber);
      return;
    }
  }

  //handle the commands of subscribed users
  if ((await mytables.getUserInfo(phonenumber, "subscribed")) == true) {
    console.log("handeling subscribed users");
    await handleUserOption(phonenumber, userMessage);
    await CommandsForSubscribedUsers(phonenumber, userMessage);
  }
}

// For Subscription
async function handleSubscription(phonenumber) {
  console.log("the phone number does not exist in the table \n");

  await mytables.createUser(phonenumber);
  await mytables.addUserInfo(phonenumber, "option", "/sub");

  client.sendMessage(
    phonenumber,
    "your number is " +
      phonenumber +
      " \nPlease send your firstname lastname age.\n Ex : Elie-joe Hajj 19"
  );

  console.log("Handle subscription function is finished \n");
  return;
}

async function CheckUsersInfo(phonenumber, userMessage) {
  if (!(await CurrentUserInfoChecked(phonenumber))) {
    userMessage = ArraySplitUserInput(userMessage);
    if (userMessage.length != 3) {
      client.sendMessage(phonenumber, "argument bigger than requested");
      return;
    }

    let firstname = userMessage[0];
    let lastname = userMessage[1];
    let age = userMessage[2];

    console.log("array of usermessage = ", firstname, lastname, age);

    let firstnameerror;
    let lastnameerror;
    let ageerror;

    let errorSendMessage;

    if (!mylib.checkIfname(firstname)) {
      firstnameerror = "No symbole or number in firstname\n";
    }
    if (!mylib.checkIfname(lastname)) {
      lastnameerror = "No symbole or number in lastname\n";
    }
    if (!mylib.checkIfage(age)) {
      ageerror = "age must be between 12 and 100\n";
    }
    errorSendMessage = firstnameerror + lastnameerror + ageerror;
    if (errorSendMessage) {
      client.sendMessage(phonenumber, errorSendMessage);
      return;
    }

    await mytables.addUserInfo(phonenumber, "firstname", firstname);
    await mytables.addUserInfo(phonenumber, "lastname", lastname);
    await mytables.addUserInfo(phonenumber, "age", age);

    client.sendMessage(
      phonenumber,
      `your phone number is ${phonenumber} Do you confirm subscription ? (Y/N) 
      phone : ${phonenumber} 
      firstname : ${firstname}
      lastname : ${lastname}
      age : ${age} `
    );
    return;
  } else if (
    !(await mytables.getUserInfo(phonenumber, "subscribed")) &&
    userMessage.toLowerCase() == "y"
  ) {
    await mytables.addUserInfo(phonenumber, "subscribed", true);
    await mytables.addUserInfo(phonenumber, "option", "");

    client.sendMessage(phonenumber, `Subscription Completed`);
    console.log("all the requirement are met so Is subscribed is = true \n");

    return;
  } else if (userMessage.toLowerCase() == "n") {
    await mytables.destroyUser(phonenumber);

    client.sendMessage(phonenumber, "Subscription Canceled.");
    console.log("Canceled subcription \n");

    return;
  }

  console.log("Check user info finished \n");
  return;
}

async function CurrentUserInfoChecked(phonenumber) {
  let firstname = await mytables.getUserInfo(phonenumber, "firstname");
  let lastname = await mytables.getUserInfo(phonenumber, "lastname");
  let age = await mytables.getUserInfo(phonenumber, "age");
  if (age && lastname && firstname) {
    return true;
  } else {
    return false;
  }
}

//For Subscribed Users
async function handleUserOption(phonenumber, userMessage) {
  if (userMessage.toLowerCase() == "/quit") {
    await mytables.addUserInfo(phonenumber, "option", "");
    return;
  }
  if (userMessage.toLowerCase() == "/help") {
    await mytables.addUserInfo(phonenumber, "option", "/help");
    return;
  }

  if (userMessage.toLowerCase() == "/lirarate") {
    await mytables.addUserInfo(phonenumber, "option", "/lirarate");
    return;
  }

  if (userMessage.toLowerCase() == "/countrytimezone") {
    await mytables.addUserInfo(phonenumber, "option", "/countrytimezone");
    return;
  }

  if (userMessage.toLowerCase() == "/mynews") {
    await mytables.addUserInfo(phonenumber, "option", "/mynews");
    return;
  }

  if (userMessage.toLowerCase() == "/addnews") {
    await mytables.addUserInfo(phonenumber, "option", "/addnews");
    return;
  }
  if (userMessage.toLowerCase() == "/removenews") {
    await mytables.addUserInfo(phonenumber, "option", "/removenews");
    return;
  }

  return;
}
async function CommandsForSubscribedUsers(phonenumber, userMessage) {
  let currentOption = await mytables.getUserInfo(phonenumber, "option");

  if (currentOption == "/help") {
    handleHelp(phonenumber);
    return;
  }

  if (currentOption == "/lirarate") {
    handleLiraRate(phonenumber);
    return;
  }

  if (currentOption == "/countrytimezone") {
    handleCountryTime(phonenumber, userMessage);
    return;
  }

  if (currentOption == "/mynews") {
    handleMyNews(phonenumber);
    return;
  }

  if (currentOption == "/addnews") {
    handleAddnews(phonenumber, userMessage);
    return;
  }
  if (currentOption == "/removenews") {
    handleRemovenews(phonenumber, userMessage);
    return;
  }

  return;
}
async function handleHelp(phonenumber) {
  var MsgCommandArray = [
    "/Cancel :to quit any operation",
    "/LiraRate \n",
    "/CountryTimeZone \n",
    "/AddNews \n",
    "/MyNews \n",
  ];
  console.log("Help command initiated \n");

  client.sendMessage(phonenumber, "Commands : \n" + MsgCommandArray.toString());
  await mytables.addUserInfo(phonenumber, "option", "");
  return;
}
async function handleLiraRate(phonenumber) {
  console.log("LiraRate command initiated \n");

  client.sendMessage(
    phonenumber,
    `Buy 1 USD for ${lira.buy} LBP
  Sell 1 USD for ${lira.sell} LBP`
  );

  await mytables.addUserInfo(phonenumber, "option", "");
  return;
}
async function handleCountryTime(phonenumber, userMessage) {
  if (userMessage.toLowerCase() != "/countrytimezone") {
    if (await mylib.axiosTimeApi(userMessage)) {
      await mylib.GetTimeZone(Countrytime, userMessage);
      client.sendMessage(
        phonenumber,
        "Time in " +
          Countrytime.timezone +
          " : " +
          Countrytime.hour +
          ":" +
          Countrytime.minute +
          ":" +
          Countrytime.seconds
      );
    } else {
      client.sendMessage(
        phonenumber,
        "Input inccorrect \n command example: Europe/London"
      );
    }
  } else {
    client.sendMessage(
      phonenumber,
      "Which capital do you need? \n command example: Europe/London"
    );
  }

  return;
}

async function handleMyNews(phonenumber) {
  let currentNews = await mytables.getUserInfo(phonenumber, "news");
  try {
    var randomSubject =
      currentNews[parseInt(Math.random() * currentNews.length)]; //maths random give value between 0 and 1
    console.log("random subject : ", randomSubject);

    var randomWord =
      allnewsOptions[randomSubject][
        parseInt(Math.random() * allnewsOptions[randomSubject].length)
      ];
    console.log("random word : ", randomWord);

    await mylib.GetWorldNews(newsResponse, newsImage, randomWord);
    try {
      const media = await MessageMedia.fromUrl(newsImage.image);
      await client.sendMessage(phonenumber, media);
    } catch {
      console.log("could not download image");
    }
    await client.sendMessage(
      phonenumber,
      JSON.stringify(newsResponse.title, null, 2) +
        "\n\n" +
        JSON.stringify(newsResponse.text, null, 2) +
        "\n\n" +
        JSON.stringify(newsResponse.url, null, 2) +
        "\n\n"
    );
    await mytables.addUserInfo(phonenumber, "option", "");
  } catch {
    client.sendMessage(phonenumber, "You have no news.");
  }
}

async function handleAddnews(phonenumber, userMessage) {
  console.log("Handeling add news initiated");

  let currentNews = await mytables.getUserInfo(phonenumber, "news");

  if (userMessage.toLowerCase() != "/addnews") {
    let invalidOptions = [];
    userMessage = ArraySplitUserInput(userMessage);

    for (let i = 0; i < userMessage.length; i++) {
      if (
        Object.keys(allnewsOptions).includes(userMessage[i].toLowerCase()) &&
        !currentNews.includes(userMessage[i].toLowerCase())
      ) {
        currentNews.push(userMessage[i].toLowerCase());
      } else {
        invalidOptions.push(userMessage[i]);
      }
      console.log(i);
    }

    console.log("invalid option : ", invalidOptions);

    await mytables.addUserInfo(phonenumber, "news", currentNews);

    if (invalidOptions[0] != undefined) {
      client.sendMessage(
        phonenumber,
        invalidOptions.toString() + " could not be added"
      );
    }
    client.sendMessage(
      phonenumber,
      "your news : " + JSON.stringify(currentNews)
    );
  } else {
    client.sendMessage(
      phonenumber,
      `Available news option : ${JSON.stringify(
        Object.keys(allnewsOptions),
        null,
        2
      )}
    your news : ${JSON.stringify(currentNews)} 
    Write the subjects you want to add, ex : Science politcs japan`
    );
  }
}

async function handleRemovenews(phonenumber, userMessage) {
  console.log("Handeling remove news initiated");

  let currentNews = await mytables.getUserInfo(phonenumber, "news");

  if (userMessage.toLowerCase() != "/removenews") {
    userMessage = ArraySplitUserInput(userMessage);

    for (var i = 0; i < userMessage.length; i++) {
      if (currentNews.includes(userMessage[i].toLowerCase())) {
        currentNews.splice(
          currentNews.indexOf(userMessage[i].toLowerCase()),
          1
        ); //indexof give index of where the msg exist in the array
      }
    }

    await mytables.addUserInfo(phonenumber, "news", currentNews);
    client.sendMessage(
      phonenumber,
      "your news : " + JSON.stringify(currentNews)
    );
  } else {
    client.sendMessage(
      phonenumber,
      `your news : ${JSON.stringify(currentNews)}
    Write the subjects you want to remove, ex : Science politcs japan`
    );
  }
}

function ArraySplitUserInput(userMessage) {
  userMessage = userMessage.split(" ");
  return userMessage;
}

client.initialize();

// setInterval(() => {
//   console.log("the array of users : " , arrayUsers);
// }, 30*1000);

let ExampleMsg = {
  _data: {
    id: {
      fromMe: false,
      remote: "96181688898@c.us",
      id: "3EB0A17F1513B0C37ACF",
      _serialized: "false_96181688898@c.us_3EB0A17F1513B0C37ACF",
    },
    body: "hi",
    type: "chat",
    t: 1662585905,
    notifyName: "TedZ",
    from: "96181688898@c.us",
    to: "96176508354@c.us",
    self: "in",
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
    links: [],
  },
  mediaKey: undefined,
  id: {
    fromMe: false,
    remote: "96181688898@c.us",
    id: "3EB0A17F1513B0C37ACF",
    _serialized: "false_96181688898@c.us_3EB0A17F1513B0C37ACF",
  },
  ack: 1,
  hasMedia: false,
  body: "hi",
  type: "chat",
  timestamp: 1662585905,
  from: "96181688898@c.us",
  to: "96176508354@c.us",
  author: undefined,
  deviceType: "web",
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
  links: [],
};
