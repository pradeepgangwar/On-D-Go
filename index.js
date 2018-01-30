'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
var pg = require("pg");
var path = require("path");


app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}))

// Process application/json
app.use(bodyParser.json())

//DB

var conString = process.env.DATABASE_URL;
var client = new pg.Client(conString);
client.connect();

client.query("CREATE TABLE IF NOT EXISTS PNR(UserID varchar(100), firstname varchar(100), pnr varchar(100))");

const token = process.env.FB_PAGE_ACCESS_TOKEN

// Index route
app.get('/', function(req, res) {
    res.send('Hello world, I am a chat bot')
})

app.get('/privacy-policy', function(req, res) {
    res.sendFile(path.join(__dirname + '/privacy-policy.html'))
})

// for Facebook verification
app.get('/webhook/', function(req, res) {
    if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        res.send(req.query['hub.challenge'])
    }
    res.send('Error, wrong token')
})

app.post('/webhook/', function(req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i]
        let sender = event.sender.id

        request({
            url: "https://graph.facebook.com/v2.6/" + sender,
            qs: {
                access_token: token,
                fields: "first_name"
            },
            method: "GET",

        }, function(error, response, body) {
            if (error) {
                console.log("error getting username")
            } else {
                var bodyObj = JSON.parse(body)
                let name = bodyObj.first_name

                if (event.message && event.message.text) {
                    let text = event.message.text
                    console.log("Sender ID: " + sender + " " + name);
                    var line = text.toLowerCase();
                    if (line.match(/hi/g) || line.match(/hello/g) || line.match(/hey/g) || line.match(/get/g)) {
                        sendTextMessage(sender, "Hey " + name + "!");
                        // setTimeout(function() {
                        // 	sendTextMessage(sender, "I can help you keep track of your daily routine and make sure they're done in time!");
                        // }, 200);
                        setTimeout(function() {
                            sendTextMessage(sender, "Enter SERVICES to see all the serivces we provide! :)");
                        }, 300);

                    } else if (line.split(" ")[0].match(/services/g)) {
                        sendTextMessage(sender, "1. For live status of train say: status <train_no> <date-in DD-MM-YYYY>");

                        setTimeout(function() {
                            sendTextMessage(sender, "2. To get list of trains departuring at a window of given hours from given station (max 4 hrs): arriving <station_code> <hours_window>");
                        }, 200);

                        setTimeout(function() {
                            sendTextMessage(sender, "3. Check pnr status say : pnr <10-digit-pnr>");
                        }, 300);

                        // setTimeout(function() {
                        // 	sendTextMessage(sender, "4. Find trains between two stations say: trains from <source station code> to <destination station code> on <dd-mm-yyyy>");
                        // }, 400);

                        setTimeout(function() {
                            sendTextMessage(sender, "OR");
                        }, 500);

                        setTimeout(function() {
                            sendTextMessage(sender, "4. Simply Save your PNR for no further hassle : save pnr <10-digit-pnr>");
                        }, 600);
                    } else if (line.split(" ")[0].match(/status/g)) {
                        request({
                            url: "https://api.railwayapi.com/v2/live/train/" + line.split(" ")[1] + "/date/" + line.split(" ")[2] + "/apikey/a32b7zrczw/",
                            qs: {
                                fields: "position"
                            },
                            method: "GET",

                        }, function(error, response, body) {
                            if (error) {
                                console.log(error)
                            } else {
                                var bodyObj = JSON.parse(body)
                                let name = bodyObj.position
                                if (name == null) {
                                    sendTextMessage(sender, "Sorry there is some error. Try again with valid train no.");
                                } else {
                                    sendTextMessage(sender, name);
                                }
                            }
                        })
                    } else if (line.match(/arriv/g)) {
                        request({
                            url: "https://api.railwayapi.com/v2/arrivals/station/" + line.split(" ")[1] + "/hours/" + line.split(" ")[2] + "/apikey/a32b7zrczw/",
                            method: "GET",

                        }, function(error, response, body) {
                            if (error) {
                                console.log(error)
                            } else {
                                var bodyObj = JSON.parse(body)
                                var times;
                                if (bodyObj.total == 0) {
                                    sendTextMessage(sender, "No trains to show")
                                } else {
                                    if (bodyObj.trains.length > 3) {
                                        times = 3;
                                    } else {
                                        times = bodyObj.trains.length;
                                    }
                                    for (var i = 0; i < times; i++) {
                                        if (bodyObj.trains[i].actarr === "Source") {
                                            if (bodyObj.trains[i].delayarr === "RIGHT TIME") {
                                                sendTextMessage(sender, bodyObj.trains[i].name + " at " + bodyObj.trains[i].schdep + " No Delay")
                                            } else {
                                                sendTextMessage(sender, bodyObj.trains[i].name + " at " + bodyObj.trains[i].schdep + " delayed by: " + bodyObj.trains[i].delayarr)
                                            }
                                        } else {
                                            if (bodyObj.trains[i].delayarr === "RIGHT TIME") {
                                                sendTextMessage(sender, bodyObj.trains[i].name + " at " + bodyObj.trains[i].actarr + " No Delay")
                                            } else {
                                                sendTextMessage(sender, bodyObj.trains[i].name + " at " + bodyObj.trains[i].actarr + " was delayed by: " + bodyObj.trains[i].delayarr)
                                            }
                                        }
                                    }
                                    console.log(bodyObj.trains[i].name)
                                }
                            }
                        })
                    } else if (line.split(" ")[0].match(/pnr/g)) {
                        request({
                            url: "https://api.railwayapi.com/v2/pnr-status/pnr/" + line.split(" ")[1] + "/apikey/a32b7zrczw/",
                            method: "GET",

                        }, function(error, response, body) {
                            if (error) {
                                console.log(error)
                            } else {
                                var bodyObj = JSON.parse(body)
                                var times;
                                if (bodyObj.response_code == 404) {
                                    sendTextMessage(sender, "This is not a valid pnr")
                                } else {
                                    //setTimeout(function() {
                                    sendTextMessage(sender, "Train: " + bodyObj.train.name + " - " + bodyObj.train.number)
                                    //},100);
                                    //setTimeout(function() {
                                    sendTextMessage(sender, "DOJ: " + bodyObj.doj)
                                    //},200);
                                    //setTimeout(function() {
                                    if (bodyObj.chart_prepared == true)
                                        sendTextMessage(sender, "CHART PREPARED")

                                    else
                                        sendTextMessage(sender, "CHART NOT PREPARED")
                                    //},300);
                                    var j = 0;
                                    for (var i = 0; i < bodyObj.total_passengers; i++) {
                                        j++;
                                        //setTimeout(function() {
                                        if (bodyObj.passengers[i].current_status)
                                            sendTextMessage(sender, "Passenger " + j + ": " + bodyObj.passengers[i].current_status)
                                        //},200);	
                                    }
                                }
                            }
                        })
                    } else if (line.split(" ")[0].match(/save/g) && line.split(" ")[1].match(/pnr/g)) {
                        var pnrNumber = line.split(" ")[2];
                        if (name != null) {
                            client.query("SELECT * FROM pnr WHERE firstname='" + name + "'", function(err, result) {
                                if (result.rows.length > 0) {
                                    sendTextMessage(sender, "You already have a pnr saved")
                                } else {
                                    var query = client.query("INSERT INTO pnr(UserID, firstname, pnr) values($1, $2, $3)", [sender, name, pnrNumber]);
                                    sendTextMessage(sender, "PNR SAVED :)");
                                    sendTextMessage(sender, "To see all your ticket info : my ticket status");
                                    sendTextMessage(sender, "To Check the status of your train : my train status");
                                    sendTextMessage(sender, "While you are in train check time to your next station : my next station")
                                }
                            })
                        }
                    } else if (line.split(" ")[0].match(/my/g) && line.split(" ")[1].match(/ticket/g) && line.split(" ")[2].match(/status/g)) {
                        client.query("SELECT pnr FROM PNR WHERE firstname='" + name + "'", function(err, result) {
                            if (result.rows.length > 0) {
                                console.log(result);
                                sendTextMessage(sender, "Your pnr is : " + result.rows[0].pnr)
                                request({
                                    url: "https://api.railwayapi.com/v2/pnr-status/pnr/" + result.rows[0].pnr + "/apikey/a32b7zrczw/",
                                    method: "GET",

                                }, function(error, response, body) {
                                    if (error) {
                                        console.log(error)
                                    } else {
                                        var bodyObj = JSON.parse(body)
                                        var times;
                                        if (bodyObj.response_code == 404) {
                                            sendTextMessage(sender, "This is not a valid pnr")
                                        } else {
                                            sendTextMessage(sender, "Train: " + bodyObj.train.name + " - " + bodyObj.train.number)

                                            sendTextMessage(sender, "DOJ: " + bodyObj.doj)
                                            //},200);
                                            //setTimeout(function() {
                                            if (bodyObj.chart_prepared == true)
                                                sendTextMessage(sender, "CHART PREPARED")

                                            else
                                                sendTextMessage(sender, "CHART NOT PREPARED")
                                            //},300);
                                            var j = 0;
                                            for (var i = 0; i < bodyObj.total_passengers; i++) {
                                                j++;
                                                //setTimeout(function() {
                                                if (bodyObj.passengers[i].current_status)
                                                    sendTextMessage(sender, "Passenger " + j + ": " + bodyObj.passengers[i].current_status)
                                                //},200);	
                                            }
                                        }
                                    }
                                })
                            } else {
                                sendTextMessage(sender, "You haven't saved any pnr, save one by entering as follows - save pnr <pnr-number>")
                            }
                        })
                    } else if (line.split(" ")[0].match(/update/g) && line.split(" ")[1].match(/pnr/g)) {
                        var pnrNumber = line.split(" ")[2];
                        client.query("SELECT * FROM pnr WHERE firstname='" + name + "'", function(err, result) {
                            if (result.rows.length > 0) {
                                client.query("UPDATE PNR SET pnr='" + pnrNumber + "' WHERE firstname='" + name + "'", function(err, result) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        sendTextMessage(sender, "Update your pnr with " + pnrNumber);
                                    }
                                })
                            } else {
                                sendTextMessage(sender, "You don't any existing entry for pnr. Add your first pnr by: save pnr <pnr_number>. And we will remember your pnr.")
                            }
                        })
                    } else if (line.split(" ")[0].match(/my/g) && line.split(" ")[1].match(/train/g) && line.split(" ")[2].match(/status/g)) {
                        client.query("SELECT pnr FROM PNR WHERE firstname='" + name + "'", function(err, result) {
                            if (result.rows.length > 0) {
                                console.log(result);
                                sendTextMessage(sender, "Your pnr is : " + result.rows[0].pnr)
                                request({
                                    url: "https://api.railwayapi.com/v2/pnr-status/pnr/" + result.rows[0].pnr + "/apikey/a32b7zrczw/",
                                    method: "GET",

                                }, function(error, response, body) {
                                    if (error) {
                                        console.log(error)
                                    } else {
                                        var bodyObj = JSON.parse(body)
                                        var times;
                                        if (bodyObj.response_code == 404) {
                                            sendTextMessage(sender, "This is not a valid pnr")
                                        } else {
                                            var TrainNumber = bodyObj.train.number;
                                            var doj = bodyObj.doj;
                                            var StationCode = bodyObj.reservation_upto.code;

                                            request({
                                                url: "https://api.railwayapi.com/v2/live/train/" + TrainNumber + "/date/" + doj + "/apikey/a32b7zrczw/",
                                                method: "GET",

                                            }, function(error, response, body) {
                                                if (error) {
                                                    console.log(error)
                                                } else {
                                                    var bodyObj = JSON.parse(body)
                                                    let name = bodyObj.position
                                                    var ArrivalTime;

                                                    for (var i = 0; i < bodyObj.route.length; i++) {
                                                        if (bodyObj.route[i].station.code == StationCode) {
                                                            ArrivalTime = bodyObj.route[i].actarr;
                                                        }
                                                    }

                                                    if (name == null) {
                                                        sendTextMessage(sender, "Make sure you're train is in the next 24-48 hrs for accurate times :)");
                                                    } else {
                                                        sendTextMessage(sender, name);
                                                        sendTextMessage(sender, "Arriving at " + ArrivalTime);
                                                    }
                                                }
                                            })
                                        }
                                    }
                                })
                            } else {
                                sendTextMessage(sender, "You haven't saved any pnr, save one by entering as follows - save pnr <pnr-number>")
                            }
                        })
                    } else if (line.split(" ")[0].match(/my/g) && line.split(" ")[1].match(/next/g) && line.split(" ")[2].match(/station/g)) {
                        client.query("SELECT pnr FROM PNR WHERE firstname='" + name + "'", function(err, result) {
                            if (result.rows.length > 0) {
                                console.log(result);
                                sendTextMessage(sender, "Your pnr is : " + result.rows[0].pnr)
                                request({
                                    url: "https://api.railwayapi.com/v2/pnr-status/pnr/" + result.rows[0].pnr + "/apikey/a32b7zrczw/",
                                    method: "GET",

                                }, function(error, response, body) {
                                    if (error) {
                                        console.log(error)
                                    } else {
                                        var bodyObj = JSON.parse(body)
                                        var times;
                                        if (bodyObj.response_code == 404) {
                                            sendTextMessage(sender, "This is not a valid pnr")
                                        } else {
                                            var TrainNumber = bodyObj.train.number;
                                            var doj = bodyObj.doj;
                                            var StationCode = bodyObj.reservation_upto.code;

                                            request({
                                                url: "https://api.railwayapi.com/v2/live/train/" + TrainNumber + "/date/" + doj + "/apikey/a32b7zrczw/",
                                                method: "GET",

                                            }, function(error, response, body) {
                                                if (error) {
                                                    console.log(error)
                                                } else {
                                                    var bodyObj = JSON.parse(body)
                                                    let name = bodyObj.position
                                                    var ArrivalTime, nextStation;

                                                    for (var i = 0; i < bodyObj.route.length; i++) {
                                                        if (bodyObj.route[i].has_arrived == false) {
                                                            ArrivalTime = bodyObj.route[i].actarr;
                                                            nextStation = bodyObj.route[i].station.code;
                                                        }
                                                    }

                                                    if (name == null) {
                                                        sendTextMessage(sender, "You need to be in the train while you check for the next station :P");
                                                    } else {
                                                        //sendTextMessage(sender, name);
                                                        sendTextMessage(sender, "Arriving next Station " + nextStation + " at " + ArrivalTime);
                                                    }
                                                }
                                            })
                                        }
                                    }
                                })
                            } else {
                                sendTextMessage(sender, "You haven't saved any pnr, save one by entering as follows - save pnr <pnr-number>")
                            }
                        })
                    }

                    // else if(line.match(/from/g) && line.match(/to/g) && line.match(/on/g))
                    // {
                    // 		request({
                    // 		url: "https://api.railwayapi.com/v2/between/source/"+line.split(" ")[2]+"/dest/"+line.split(" ")[4]+"/date/"+line.split(" ")[6]+"/apikey/a32b7zrczw/",
                    // 		method: "GET",

                    // 	}, function (error, response, body) {
                    // 		if (error) {
                    // 			console.log(error)
                    // 		}
                    // 		else {
                    // 			var bodyObj = JSON.parse(body)
                    // 			var times;
                    // 			if(bodyObj.response_code == 404) {
                    // 				sendTextMessage(sender, "This is not a valid pnr")
                    // 			}
                    // 			else {
                    // 				for(var i=0;i<bodyObj.trains.length;i++)
                    // 				{
                    // 					sendTextMessage(sender, "Train: "+bodyObj.trains[i].name+"/"+bodyObj.trains[i].number+"  Arrival-time: "+bodyObj.trains[i].dest_arrival_time+"  Departure-time: "+bodyObj.trains[i].src_departure_time)
                    // 				}
                    // 			}
                    // 		}
                    // 	})
                    // }
                    else {
                        sendTextMessage(sender, "I don't seem to understand your query ... :/ Please Try Again");
                    }

                }
            }
        })
    }
    res.sendStatus(200)
})



function sendTextMessage(sender, text) {
    let messageData = {
        text: text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: token
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}



// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
})
