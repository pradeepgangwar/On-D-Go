'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const apiai = require('apiai');
const app = express()

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
                    if(text == "Hi" || text == "Hello"){
                        sendTextMessage(sender, "Hi");
                        sendTextMessage(sender, name);
                        sendTextMessage(sender, "Whatsup?");
                    }
					

					var app2 = apiai("3a25958e736d4d52b244850761f77bb6");

					var request2 = app2.textRequest(text, {
						sessionId: '21'
					});

					request2.on('response', function(response) {
						sendTextMessage(sender, response);
					});

					request2.on('error', function(error) {
						console.log(error);
					});

					request2.end();
                }
            }
        })
    }
    res.sendStatus(200)
})

const token = process.env.FB_PAGE_ACCESS_TOKEN

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