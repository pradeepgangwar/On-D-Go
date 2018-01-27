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


client.query("CREATE TABLE IF NOT EXISTS userData(UserID varchar(100), firstname varchar(100))");

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
						//var query = client.query("INSERT INTO userData(UserID, firstname) values($1, $2)", [sender, name]);
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
						sendTextMessage(sender, "1. For live status of train say: train <train_no> <date-in DD-MM-YYYY>");
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
                                console.log(name)
                                sendTextMessage(sender, name);
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
                                for (var i=0; i<3; i++) {
                                    sendTextMessage(sender, "Train Name: " + bodyObj.trains[i].name)
                                }
                                console.log(bodyObj.trains[i].name)
                            }
                        })
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