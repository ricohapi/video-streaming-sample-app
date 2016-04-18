# Ricoh Video Streaming Sample

Video streaming API sample app.

## Requirements

* Google Chrome 49 or newer.
* Web Camera accessible from your browser.
* Enable Web Camera access in your browser setting.

You'll also need

* Ricoh API Client Credentials (client_id & client_secret)
* Ricoh ID (user_id & password)

If you don't have them, please register them at [THETA Developers Website](http://contest.theta360.com/).

## Setup

```sh
$ git clone https://github.com/ricohapi/video-streaming-sample-app
$ cd video-streaming-sample-app
$ cp samples/config_template.js samples/config.js
```

and put your credentials into the `config.js`.

## Build

```sh
$ npm install
$ gulp build
```

## Video Streaming

Connect the Web Camera and execute `gulp run`, then the browser will be opened.  
Select the Web Camera, put your Ricoh ID & password, and submit the login button.  
Let the peer user login on his own device following the instruction above, then put the peer's User ID to the Peer-ID field and submit Connect button, then streaming connection will start between you and the peer.

```sh
$ gulp run
```

## THETA View

If the peer user is using THETA, push THETA View button, then you'll see the draggable & zoomable 360° view.
