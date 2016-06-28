# Ricoh One-way Video Streaming Sample (Broadcast)
In this sample, you can try Ricoh One-way Video Streaming distribution.  
See [oneway-watch](https://github.com/ricohapi/video-streaming-sample-app/tree/master/samples/oneway-watch) for Viewing Ricoh One-way Video Streaming.

## Requirements
* Raspbian Jessie or another Operating System similar to it.
* Node.js 5.0 or newer.
* Web Camera accessible from your browser.

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
$ cd oneway-broadcast
$ cp ../config_template.js ./config.js
```
and put your credentials into the `config.js`.  

Install Mozilla Firefox(Iceweasel), Xvfb and other packages you need.  
In Raspbian Jessie, the following command will be executed:

```sh
$ apt-get install firefox-esr xvfb
$ npm install
```

## Video Streaming distribution
Connect to your Web camera.  
Execute the command `npm start`, then a Web browser is started in the background.  
When receiving the Streaming request, it start Video Streaming distribution.  

```sh
$ npm start
```
