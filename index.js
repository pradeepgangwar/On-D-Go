'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
var pg = require("pg");

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

//DB

var conString = "postgres://wxjvrhqrbqjros:a24eabb637dc812603e6b9b927f78fb15d1be6cd5196f2c2bb11f4695871fca2@ec2-54-225-230-142.compute-1.amazonaws.com:5432/d5ot44f3mlrilt";
var client = new pg.Client(conString);
client.connect();


client.query("CREATE TABLE IF NOT EXISTS PNR(UserID varchar(100), firstname varchar(100), pnr varchar(100))");

const token = process.env.FB_PAGE_ACCESS_TOKEN

app.post('/webhook/', function (req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++) {
		let event = req.body.entry[0].messaging[i]
		let sender = event.sender.id

		request({
			url: "https://graph.facebook.com/v2.6/" + sender,
			qs: {
				access_token : token,
				fields: "first_name"
			},
			method: "GET",

		}, function(error, response, body) {
			if(error){
				console.log("error getting username")
			} else{
				var bodyObj = JSON.parse(body)
				let name = bodyObj.first_name

				if (event.message && event.message.text) {
					let text = event.message.text
					console.log("Sender ID: " + sender + " " + name);
					var line = text.toLowerCase();
					if(line.match(/hi/g) || line.match(/hello/g) || line.match(/hey/g)) {
						sendTextMessage(sender, "Hey " + name + "!");
						setTimeout(function() {
							sendTextMessage(sender, "I can help you keep track of your daily routine and make sure they're done in time!");
						}, 200);
						setTimeout(function() {
							sendTextMessage(sender, "Type help to see  what I can do for you :)");
						}, 300);
						
					}
					else if(line.match(/help/g)) {
						sendTextMessage(sender, "Fuck help");
					}
					else if(line.match(/add/g) && line.split(" ")[1].match(/office/g)) {
						sendTextMessage(sender, "This is how you can add ... ");
						setTimeout(function() {
							sendTextMessage(sender, "<Time> <From> to <To> by <Mode>");
						}, 200);
						setTimeout(function() {
							sendTextMessage(sender, "Eg: 9am allahabad to lucknow by car");
						}, 300);
					}
					else if(line.match(/train/g))
					{
						sendTextMessage(sender, "1. For live status of train say:");
						setTimeout(function() {
							sendTextMessage(sender, " status <train_no> <date-in DD-MM-YYYY>");
						}, 200);
						setTimeout(function() {
							sendTextMessage(sender, "2. To get list of trains departuring at a window of given hours from given station (max 4 hrs)");
						}, 300);
						setTimeout(function() {
							sendTextMessage(sender, "arriving <station_code> <hours_window>");
						}, 400);
						setTimeout(function() {
							sendTextMessage(sender, "3. Check pnr status say:");
						}, 500);
						setTimeout(function() {
							sendTextMessage(sender, "pnr <10-digit-pnr>");
						}, 600);
						setTimeout(function() {
							sendTextMessage(sender, "4. Simply Save your PNR");
						}, 500);
						setTimeout(function() {
							sendTextMessage(sender, "save pnr <10-digit-pnr>");
						}, 600);
					}

					else if(line.match(/status/g))
					{
						request({
							url: "https://api.railwayapi.com/v2/live/train/"+line.split(" ")[1]+"/date/"+line.split(" ")[2]+"/apikey/a32b7zrczw/",
							qs: {
								fields: "position"
							},
							method: "GET",

						}, function (error, response, body) {
							if (error) {
								console.log(error)
							}
							else {
								var bodyObj = JSON.parse(body)
								let name = bodyObj.position
								if(name == null) {
									sendTextMessage(sender, "Sorry there is some error. Try again with valid train no.");
								}
								else {
									sendTextMessage(sender, name);
								}
							}
						})
					}


					else if(line.match(/arriv/g))
					{
						request({
							url: "https://api.railwayapi.com/v2/arrivals/station/"+line.split(" ")[1]+"/hours/"+line.split(" ")[2]+"/apikey/a32b7zrczw/",
							method: "GET",

						}, function (error, response, body) {
							if (error) {
								console.log(error)
							}
							else {
								var bodyObj = JSON.parse(body)
								var times;
								if(bodyObj.total == 0) {
									sendTextMessage(sender, "No trains to show")
								}
								else {
									if(bodyObj.trains.length > 3) {
										times = 3;
									}
									else {
										times = bodyObj.trains.length;
									}
									for (var i=0; i<times; i++) {
										if(bodyObj.trains[i].actarr === "Source") {
											if(bodyObj.trains[i].delayarr === "RIGHT TIME") {
												sendTextMessage(sender, bodyObj.trains[i].name + " at " + bodyObj.trains[i].schdep + " No Delay")
											}
											else {
												sendTextMessage(sender, bodyObj.trains[i].name + " at " + bodyObj.trains[i].schdep + " delayed by: " + bodyObj.trains[i].delayarr)                                            
											}
										}
										else {
											if(bodyObj.trains[i].delayarr === "RIGHT TIME") {
												sendTextMessage(sender, bodyObj.trains[i].name + " at " + bodyObj.trains[i].actarr + " No Delay")                  
											}
											else {
												sendTextMessage(sender, bodyObj.trains[i].name + " at " + bodyObj.trains[i].actarr + " was delayed by: " + bodyObj.trains[i].delayarr)                                                             
											}
										}
									}
									console.log(bodyObj.trains[i].name)
								}
							}
						})
					}

					else if(line.split(" ")[0].match(/pnr/g))
					{
						request({
							url: "https://api.railwayapi.com/v2/pnr-status/pnr/"+line.split(" ")[1]+"/apikey/a32b7zrczw/",
							method: "GET",

						}, function (error, response, body) {
							if (error) {
								console.log(error)
							}
							else {
								var bodyObj = JSON.parse(body)
								var times;
								if(bodyObj.response_code == 404) {
									sendTextMessage(sender, "This is not a valid pnr")
								}
								else {
									//setTimeout(function() {
										sendTextMessage(sender, "Train: "+bodyObj.train.name+" - "+bodyObj.train.number )
									//},100);
									//setTimeout(function() {
										sendTextMessage(sender, "DOJ: "+bodyObj.doj)
									//},200);
									//setTimeout(function() {
										if(bodyObj.chart_prepared==true)
											sendTextMessage(sender, "CHART PREPARED")

										else
											sendTextMessage(sender, "CHART NOT PREPARED")
									//},300);
									var j = 0;
									for(var i=0;i<bodyObj.total_passengers;i++)
									{
										j++;
										//setTimeout(function() {
											if(bodyObj.passengers[i].current_status)
												sendTextMessage(sender, "Passenger " + j +": "+bodyObj.passengers[i].current_status)	
										//},200);	
									}
								}
							}
						})
					}

					else if(line.split(" ")[0].match(/save/g) && line.split(" ")[1].match(/pnr/g)) {
						var pnrNumber = line.split(" ")[2];
						if(name != null) {
							client.query('SELECT * FROM PNR WHERE firstname="Gagan"', function(err, result) {
								if(err) console.log(err);
								console.log(result);
								// if(result) {
									
								// 		sendTextMessage(sender, "You already have a pnr saved");
								// }
								// else {
								// 	var query = client.query("INSERT INTO PNR(UserID, firstname, pnr) values($1, $2, $3)", [sender, name, pnrNumber]);
								// 	sendTextMessage(sender, "pnr saved, for information about your train, just type in - my train status");
								// }
							})
						}
					}
				}
			}
		})
}
res.sendStatus(200)
})



function sendTextMessage(sender, text) {
	let messageData = { text:text }
	request({
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {access_token:token},
		method: 'POST',
		json: {
			recipient: {id:sender},
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