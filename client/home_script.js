var QueuedListJSON;
var strItems;

function initPage() {
    checkSWSupport();
    //getQueue();
    registerServiceWorker();
    askPermission();


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

function checkSWSupport() {
    if (!('serviceWorker' in navigator)) {
        document.getElementById("sw_indicator").classList.add("bg_red");
        // Service Worker isn't supported on this browser, disable or hide UI.
        return;
    } else {
        document.getElementById("sw_indicator").classList.add("bg_green");
        return;
    }

    if (!('PushManager' in window)) {
        document.getElementById("push_indicator").classList.add("bg_red");
        return;
    } else {
        console.log("avail");
        document.getElementById("push_indicator").classList.add("bg_green");
        return;

    }
}

function registerServiceWorker() {
    return navigator.serviceWorker.register('/service-worker.js')
        .then(function (registration) {
            console.log('Service worker successfully registered.');
            return registration;
        })
        .catch(function (err) {
            console.error('Unable to register service worker.', err);
        });
}


function askPermission() {
    return new Promise(function (resolve, reject) {
            const permissionResult = Notification.requestPermission(function (result) {
                resolve(result);
            });

            if (permissionResult) {
                permissionResult.then(resolve, reject);
            }
        })
        .then(function (permissionResult) {
            if (permissionResult !== 'granted') {
                throw new Error('We weren\'t granted permission.');
            } else {

            }
        });
}

function subscribeUserToPush() {
    return navigator.serviceWorker.register('/service-worker.js')
        .then(function (registration) {
            const subscribeOptions = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    'BPoMkxutZXHEINP2YJStqO_Pc-T6Q8FC5C49-rvz0ep6l9q6WjRmKOE0qna0b5TA6AEn16wUtEaU-9E8gz0zLd8'
                )
            };

            return registration.pushManager.subscribe(subscribeOptions);
        })
        .then(function (pushSubscription) {
            console.log('Received PushSubscription: ', JSON.stringify(pushSubscription));
            return pushSubscription;
        })
        .then(function (subscription) {
            fetch('/api/save-subscription/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(subscription)
                })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Bad status code from server.');
                    }

                    return response.json();
                })
                .then(function (responseData) {
                    if (!(responseData.data && responseData.data.success)) {
                        throw new Error('Bad response from server.');
                    }
                });
        });;
}

function sendSubscriptionToBackEnd(subscription) {
    return fetch('/api/save-subscription/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription)
        })
        .then(function (response) {
            if (!response.ok) {
                throw new Error('Bad status code from server.');
            }

            return response.json();
        })
        .then(function (responseData) {
            if (!(responseData.data && responseData.data.success)) {
                throw new Error('Bad response from server.');
            }
        });
}

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function start_Monitor() { 
    subscribeUserToPush();
}
