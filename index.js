const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const request = require('request');
const app = express();

const nameDB = require('./db/itemsName.json');




const {
    Client,
    Intents
} = require('discord.js');
const {
    token
} = require('./config.json');

// Create a new client instance
const client = new Client({
    intents: [Intents.FLAGS.GUILDS]
});


const port = process.env.PORT || 3000;


app.use(bodyParser.json());


//bot part======================
//init
var queuedItemsCache = {
    resultCode: '',
    resultMsg: ''
};
var botChannel;
var notificationChannel;

client.on('ready', () => {
    console.log("Bot ready");
    botChannel = client.channels.cache.find(channel => channel.name === 'items-queue');
    notificationChannel = client.channels.cache.find(channel => channel.name === 'items-queue-notification'); 
    getQueuedItems();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const {
        commandName
    } = interaction;

    if (commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if (commandName === 'server') {
        await interaction.reply('Server info.');
    } else if (commandName === 'user') {
        await interaction.reply('User info.');
    }
});

async function getQueuedItems() {
    let res = await doRequest();
    await sleep(10000);
    getQueuedItems();
}

function doRequest() {
    return new Promise(function (resolve, reject) {
        var options = {
            'method': 'POST',
            'url': 'https://trade.sea.playblackdesert.com/Trademarket/GetWorldMarketWaitList',
            'headers': {
                'Content-Type': 'application/json',
                'User-Agent': 'BlackDesert',
                'Cookie': 'nlbi_2512950=e0mkGG7jk3bRFo14lq8CZwAAAAAYcOXNJ6i2peEfw4Qf+VOb; visid_incap_2512950=SPki70JzThaDGXnxcRTrdksG0GEAAAAAQUIPAAAAAACuL4enyIWHYCIoLhFE5jcB; incap_ses_1137_2512950=yHNWcPnYY0OGKZ+W8G/HD2sX0GEAAAAAitupqQuDAUe5CeswCeAb2g=='
            }
        };
        request(options, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
                if (JSON.parse(res.body)["resultMsg"] == "0") {
                    console.log("no item");
                } else if (queuedItemsCache['resultMsg'] != JSON.parse(res.body)["resultMsg"]) {
                    console.log("new item");
                    queuedItemsCache = JSON.parse(res.body);
                    generateList();
                    notify_channel(); 
                }
            } else {
                reject(error);
                console.log(error);
            }
        });
    });
}

function generateList() {
    var strRes = queuedItemsCache['resultMsg'];
    var strItems = strRes.split('|');
    var strList = new Array();
    var strMSG = "```Queue Changed : \n";
    for (var i = 0; i < strItems.length - 1; i++) {
        var strAtt = strItems[i].split('-');
        var strName = getName(strAtt[0]);
        strList[i] = strName + " | Enhancement : " + strAtt[1] + " | Price : " + numberWithCommas(strAtt[2]) + " | List time : " + parseDate(strAtt[3]) + "\n"; 
        strMSG += strList[i];
    } 
    strMSG += "```"; 
    notifyUser('434616046041956352', strMSG);  
    
}

function parseDate(sec) { //bdo api return time in utcsec epoch sec from 1970 jan 1
    var utcSeconds = sec;
    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    d.setUTCSeconds(utcSeconds);
    return d;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


async function notify_channel() {
    var timestamp = Date.now()
    var humanReadableDateTime = new Date(timestamp).toLocaleString()
    notificationChannel.send("new item queued, Time: " + humanReadableDateTime);
}
 


function notifyUser(id,message) {
    client.users.fetch(id, false).then((user) => {
        user.send(message);
    });
}


//WEB API=====================
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/home.html'));
    console.log("res / ");
});

app.get('/style.css', function (req, res) {
    res.sendFile(path.join(__dirname, '/client/style.css'));
});


app.get('/home_script.js', function (req, res) {
    res.sendFile(path.join(__dirname, '/client/home_script.js'));
});

app.get("/getQueueList", function (req, res) {
    var options = {
        'method': 'POST',
        'url': 'https://trade.sea.playblackdesert.com/Trademarket/GetWorldMarketWaitList',
        'headers': {
            'Content-Type': 'application/json',
            'User-Agent': 'BlackDesert',
            'Cookie': 'nlbi_2512950=e0mkGG7jk3bRFo14lq8CZwAAAAAYcOXNJ6i2peEfw4Qf+VOb; visid_incap_2512950=SPki70JzThaDGXnxcRTrdksG0GEAAAAAQUIPAAAAAACuL4enyIWHYCIoLhFE5jcB; incap_ses_1137_2512950=yHNWcPnYY0OGKZ+W8G/HD2sX0GEAAAAAitupqQuDAUe5CeswCeAb2g=='
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        res.setHeader('Content-Type', 'application/json');
        res.send(response.body);
    });
});


app.get("/init", function (req, res) {
    res.send("queue");
});


app.get('/getName/:id', function (req, res) {
    res.send(getName(req.params.id));
});

var getMarketQueueList = function () {
    console.log("MCQ");
}

function getName(id) {
    var val = id;
    var filteredObj = nameDB.find(function (item, i) {
        if (item[0] === val) {
            index = i;
            return i;
        }
    });
    return filteredObj[1];
}


app.listen(port);

client.login(token);

/*

    Object.keys(itemdb).forEach(function(key) {  
        trimJSON(itemdb[key],['locale_default','locale_name']);
        console.log(itemdb[key]);
    });
    fs.writeFile("./db/newjson.json", JSON.stringify(itemdb), function writeJSON(err) {
      if (err) return console.log(err); 
    });
    */
