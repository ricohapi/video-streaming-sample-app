# Ricoh One-way Video Streaming Sample (Watch)
In this sample, you can try Viewing Ricoh One-way Video Streaming.  
See [oneway-broadcast](https://github.com/ricohapi/video-streaming-sample-app/tree/master/samples/oneway-broadcast) for Ricoh One-way Video Streaming distribution.

## Requirements
* Google Chrome 51+ or Mozilla Firefox 47+
* Node.js 5.0 or newer.

You'll also need

* Ricoh API Client Credentials (client_id & client_secret)
* Ricoh ID (user_id & password)

If you don't have them, please register them at [THETA Developers Website](http://contest.theta360.com/).

## Setup
```sh
$ git clone https://github.com/ricohapi/video-streaming-sample-app.git
$ cd video-streaming-sample-app/samples
$ npm install
$ npm run build
```

Make config.js from config_template.js.
```sh
$ cd oneway-watch
$ cp ../config_template.js ./config.js
```
and put your credentials into the `config.js`.

## Viewing Streaming Video
Execute `npm start`, then the browser will be opened.
Put your Ricoh ID & password, and submit the login button.
Then put the sender's User ID to the Peer-ID field and submit Connect button, then streaming connection will start between sender and reciever.

```sh
$ npm start
```

## THETA View
If the peer user is using THETA, push THETA View button, then you'll see the draggable & zoomable 360° view.
