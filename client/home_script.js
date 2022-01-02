var QueuedListJSON;
var strItems;
var rootDir = "https://bdo-cmq.herokuapp.com/";

function initPage() { 
    //getQueue(); 


}

function getQueue() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "http://localhost:3000/getQueueList", true); // false for synchronous request
    xmlHttp.send();

    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            QueuedListJSON = JSON.parse(xmlHttp.responseText);
            if (QueuedListJSON['resultMsg'] == "0") {
                console.log("empty");
            } else {
                console.log(QueuedListJSON);
                parseJsonToItems();
                ListQueuedItems();
            }
        }
    }
    // var res_jsonObj = JSON.parse(xmlHttp.responseText);
    // console.log(res_jsonObj);
}

function parseDate(sec) { //bdo api return time in utcsec epoch sec from 1970 jan 1
    var utcSeconds = sec;
    var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
    d.setUTCSeconds(utcSeconds);
    return d;
}

function parseEnhancement(name, e) {}

function parseJsonToItems() {
    var strRes = QueuedListJSON['resultMsg'];
    strItems = strRes.split('|');
    console.log(strItems);
}

function ListQueuedItems() {
    document.getElementById("displayPanel").innerHTML = "";
    for (var i = 0; i < strItems.length - 1; i++) {
        var newdiv = document.createElement("div");
        var strAtt = strItems[i].split('-');
        var strInner = "Item Id: " + strAtt[0] + "| Name: " + getItemName(strAtt[0]) + " | Enhancement:" + strAtt[1] + " | Price:" + numberWithCommas(strAtt[2]) + " | Time" + parseDate(strAtt[3]);
        newdiv.innerHTML = strInner;
        document.getElementById("displayPanel").appendChild(newdiv);
    }
}

function getItemName(id) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "http://localhost:3000/getName/" + id, false); // false for synchronous request
    xmlHttp.send();

    return xmlHttp.responseText;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

