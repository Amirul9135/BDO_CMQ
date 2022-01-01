const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const request = require('request');
const app = express();
const webpush = require('web-push')

const nameDB = require('./db/itemsName.json');
const dummyDb = {
    subscription: null
};

const vapidKeys = {
    publicKey: 'BPoMkxutZXHEINP2YJStqO_Pc-T6Q8FC5C49-rvz0ep6l9q6WjRmKOE0qna0b5TA6AEn16wUtEaU-9E8gz0zLd8',
    privateKey: '-NvhXrbrSk-PAvRKjvUKC0OGICBN4VmLoANBSgC_iIM',
}

webpush.setVapidDetails(
  'mailto:nitoryu913@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/home.html'));
});

app.get('/style.css', function (req, res) {
    res.sendFile(path.join(__dirname, '/client/style.css'));
});


app.get('/home_script.js', function (req, res) {
    res.sendFile(path.join(__dirname, '/client/home_script.js'));
});

app.get('/service-worker.js', function (req, res) {
    res.sendFile(path.join(__dirname, '/service-worker.js'));
});

app.get("/getQueueList", function (req, res) {
    var request = require('request');
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



app.post('/json', function (request, response) {
    console.log(request.body); // your JSON
    response.send(request.body); // echo the result back
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
 

app.post('/api/save-subscription/', function (req, res) {
    dummyDb.subscription = req.body;
    console.log("save");
});

function saveSubscriptionToDatabase(obj) {
    console.log(obj);
}

const sendNotification = (subscription, dataToSend) => {
    webpush.sendNotification(subscription, dataToSend)
}


//test routes
app.get('/send-notification', (req, res) => {
    
    const subscription = dummyDb.subscription //get subscription from your databse here.
    const message = '{"name": "test"}'
    sendNotification(subscription, message);
    
    console.log(dummyDb.subscription);
    res.send();
})



app.listen(3000);


/*

    Object.keys(itemdb).forEach(function(key) {  
        trimJSON(itemdb[key],['locale_default','locale_name']);
        console.log(itemdb[key]);
    });
    fs.writeFile("./db/newjson.json", JSON.stringify(itemdb), function writeJSON(err) {
      if (err) return console.log(err); 
    });
    */
