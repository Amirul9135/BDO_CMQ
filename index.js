const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const request = require('request');
const app = express();

const nameDB = require('./db/itemsName.json');
const categoryDB = require('./db/itemCategory.json');

const StrEnhancement = ["[I]PRI","[II]DUO","[III]TRI","[IV]TET","[V]PEN"]; 



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
                } else if (compareQueue(JSON.parse(res.body)["resultMsg"])) {
                    console.log("new item");
                    queuedItemsCache = JSON.parse(res.body);
                    var itemsList = generateList();
                    var strMSG = "```Queue changes:\n";
                    for(var i = 0; i < itemsList.length;i++ ){
                        strMSG += itemsList[i] + "\n";
                    }
                    strMSG += "```"; 
                    notifyUser('434616046041956352', strMSG);
                    notify_channel();
                }
            } else {
                reject(error);
                console.log(error);
            }
        });
    });
}

function compareQueue(newResultMsg) { //return true if different
    var strCurItem = queuedItemsCache['resultMsg'].split('|');
    var strNew = newResultMsg.split('|');

    if (strNew.length > strCurItem.length) {
        return true;

    } else {
        for (var i = 0; i < strNew.length - 1; i++) {
            if (strCurItem.indexOf(strNew[i]) == -1) { //item not found in current, change = true
                return true;
            }
        }
    }

    return false;
}

function generateList() {
    var strRes = queuedItemsCache['resultMsg'];
    var strItems = strRes.split('|');
    var strList = new Array(); 
    for (var i = 0; i < strItems.length - 1; i++) {
        var strAtt = strItems[i].split('-');
        var strName = getName(strAtt[0]);
        strList[i] = parseEnhancement(strAtt[0],strAtt[1]) + " : " + strName + " | Price : " + numberWithCommas(strAtt[2]) + " | List time : " + formatDateTime(convertTZ(parseDate(strAtt[3]), "Asia/Kuala_Lumpur"));
    }  
    return strList;

}

function parseDate(sec) { //bdo api return time in utcsec epoch sec from 1970 jan 1
    var utcSeconds = sec;
    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    d.setUTCSeconds(utcSeconds);
    return d;
}

function formatDateTime(dateObj) {
    var hours = dateObj.getHours();
    var minutes = dateObj.getMinutes();
    var seconds = dateObj.getSeconds();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;
    var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    return strTime + " | " + dateObj.getDate() + "/" + dateObj.getMonth() + 1 + "/" + dateObj.getFullYear(); 
}

function convertTZ(date, tzString) {
    return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
        timeZone: tzString
    }));
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

function parseEnhancement(id,enhc){  //consider fga later 
    if(categoryDB[id]["category_primary"] == "20"){ 
        return StrEnhancement[parseInt(enhc) - 1];
    }
    else{
        if(parseInt(enhc)>15){
            return StrEnhancement[parseInt(enhc) - 16];
        }
        else{
            return "+" + enhc;
        }
    }
}


function notifyUser(id, message) {
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
    res.setHeader('Content-Type', 'application/json'); 
    var strList = generateList();
    var strResJSON = "{"; 
    console.log(strList);
    for(var i=0;i< strList.length ; i++){
        strResJSON += '"' + i.toString() + '" : "' + strList[i] + '",' ; 
    } 
    console.log(strResJSON);
    res.send(strResJSON);
 /*   var options = {
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
    });*/
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
