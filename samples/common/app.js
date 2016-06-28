/* global Clipboard,RTCMultiConnection,DetectRTC,m,CONFIG */
/* eslint no-console: ["error", { allow: ["error"] }] */
'use strict';

/**
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const RicohAPI = require('./ricohapi-bosh');
const UDCConnection = require('./UDCConnection').UDCConnection;

const conn = new RTCMultiConnection();
const aclient = new RicohAPI.AuthClient(CONFIG.clientId, CONFIG.clientSecret);
const bosh = new RicohAPI.BoshClient(aclient);

if (typeof Clipboard !== 'undefined') {
  const clipboard = new Clipboard('.cpbtn');
  clipboard.on('success', e => e.clearSelection());
}

let _instance = null; // for singleton

// Model
export class App {

  constructor() {
    if (_instance !== null) return _instance;
    this._cameras = [];
    this.isWatcher = false;
    this.isFirefox = false;
    this.isOneWay = (typeof window.__oneway !== 'undefined');

    if (typeof m === 'undefined') return _instance;
    this.username = m.prop('');
    this.userpass = m.prop('');
    this.peername = m.prop('');
    this.peerurl = m.prop('');
    this.peermoz = m.prop('');
    this.peerurlid = m.prop('');
    this.myurl = m.prop('');
    this.mymoz = m.prop('');
    this.myurlid = m.prop('');
    this.camid = m.prop('');
    this.state = m.prop('initial');

    _instance = this;
    return _instance;
  }

  _connect(uname, upass) {
    return new Promise((resolve, reject) => {
      aclient.setResourceOwnerCreds(uname.split('+')[0], upass);
      bosh.connect(uname, upass)
        .then(() => {
          conn.userid = uname;
          conn.bosh = bosh;
          conn.setCustomSocketHandler(UDCConnection);
          conn.socketMessageEvent = 'ricohapi-streaming';
          conn.mediaConstraints.audio = false;
          resolve();
        })
        .catch(e => {
          console.error(e);
          reject();
        });
    });
  }

  connect() {
    this.state('connecting');
    return new Promise((resolve, reject) => {
      this._connect(this.username(), this.userpass())
        .then(() => {
          this.state('ready');
          resolve();
        })
        .catch(() => {
          this.state('fail');
          reject();
        });
    });
  }

  disconnect() {
    conn.close();
    setTimeout(() => { // delay for firefox
      bosh.disconnect();
      this.myurl('');
      this.mymoz('');
      this.peerurl('');
      this.peermoz('');
      this.camid('');
      this.state('initial');
    }, 1000);
  }

  _rmc3() {
    this.state('calling');
    conn.session = { audio: false, video: true, oneway: this.isOneWay };
    conn.sdpConstraints.mandatory = {
      OfferToReceiveAudio: false,
      OfferToReceiveVideo: !this.isOneWay,
    };
    conn.onstream = event => {
      const elm = event.mediaElement;
      elm.controls = false;
      if (this.myurl() || this.mymoz() || this.isWatcher) {
        if (conn.DetectRTC.browser.isFirefox) this.peermoz(elm.mozSrcObject);
        else this.peerurl(elm.src);
        this.peerurlid(elm.id);
        this.peername(event.userid);
        this.state('chatting');
      } else {
        if (conn.DetectRTC.browser.isFirefox) this.mymoz(elm.mozSrcObject);
        else this.myurl(elm.src);
        this.myurlid(elm.id);
        this.state('chatready');
      }
      elm.play();
      setTimeout(() => elm.play(), 5000);
      m.redraw();
    };
  }

  call() {
    if (this.isOneWay) this.isWatcher = true;
    this._rmc3();
    conn.join(this.peername());
  }

  open() {
    conn.mediaConstraints.video = { deviceId: this.camid() };
    this._rmc3();
    conn.open(this.username());
  }

  list(cb) {
    conn.DetectRTC.load(() => {
      conn.DetectRTC.MediaDevices.forEach(device => {
        if (device.kind.indexOf('video') === -1) return;
        this.isFirefox = (device.label === 'Please invoke getUserMedia once.');
        const did = this.isFirefox ? '' : device.id;
        const dlabel = this.isFirefox ? 'choose when needed' : device.label;
        if (this._cameras.find(c => c.id === did)) return;
        this._cameras.push({ id: did, label: dlabel });
      });
      cb(this._cameras);
    });
  }

  // out of Mithril
  headless(uname, upass, dom) {
    this._connect(uname, upass)
      .then(() => {
        conn.videosContainer = dom;
        conn.session = { audio: false, video: true, oneway: true };
        conn.sdpConstraints.mandatory = {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false,
        };
        conn.onstream = event => {
          const elm = event.mediaElement;
          conn.videosContainer.appendChild(elm);
          elm.play();
          setTimeout(() => elm.play(), 3000);
        };
        conn.open(uname);
      })
      .catch(console.error);
  }

  static getInstance() {
    if (_instance === null) {
      _instance = new App();
    }
    return _instance;
  }
}
