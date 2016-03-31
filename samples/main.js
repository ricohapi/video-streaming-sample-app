'use strict';
/*
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 *
 * main.js for browser sample
 */

const UDCStrophe = require('./UDCStrophe').UDCStrophe;
const StrophePeer = require('./strophePeer').StrophePeer;
const Webcam = require('./webcam').Webcam;
const ThetaView = require('./thetaview').ThetaView;
const CONFIG = require('./config').CONFIG;

const xmpp = new UDCStrophe(CONFIG.clientId, CONFIG.clientSecret);
const webrtc = new StrophePeer();
const webcam = new Webcam();
const thetaview = new ThetaView();

let _view = 'INITIAL';
let _app = {};
let _thetatimer = null;

function hide(id) {
  const elm = document.querySelector(id);
  if (elm.style.display === '') elm.style.display = 'none';
}

function show(id) {
  const elm = document.querySelector(id);
  if (elm.style.display === 'none') elm.style.display = '';
}

function getSelected(id) {
  const ret = Array.prototype.slice.call(document.getElementsByName(id))
    .filter(o => (o.checked))[0];
  return ret? ret.value : undefined;
}

function camera2elm(camera) {
  const radio = document.createElement('input');
  radio.setAttribute('type', 'radio');
  radio.setAttribute('name', 'radio');
  radio.setAttribute('value', camera.id);
  const label = document.createElement('label');
  label.appendChild(radio);
  label.appendChild(document.createTextNode(camera.label));
  return label;
}

function nextView(view, evt) {
  const SM_DEFINE = {
    INITIAL: {
      ok: 'CAMERA_READY',
      ng: 'CAMERA_ERROR',
    },
    CAMERA_READY: {
      evtClickLogin: 'LOGING_IN',
    },
    CAMERA_ERROR: {
      // dead end
    },
    LOGING_IN: {
      ok: 'READY',
      ng: 'CAMERA_READY',
    },
    READY: {
      evtClickConnect: 'CONNECTING',
      evtOnCall: 'CONNECTING',
      evtClickLogout: 'CAMERA_READY',
    },
    CONNECTING: {
      evtArrivePeer: 'CHATTING',
      evtClickLogout: 'CAMERA_READY',
    },
    CHATTING: {
      evtClickLogout: 'CAMERA_READY',
      evtThetaView: 'CHATTING',
    }
  };
  return SM_DEFINE[view][evt];
}

// DOM read write
function update(view, app) {
  if (view === 'CAMERA_READY') {
    if (app.cameras.length === 0) {
      show('#nocamera');
      return; // dead end
    }
    if (app.error) {
      show('#loginerr');
      app.error = false;
    }
    const radios = document.getElementById('cameras');
    radios.innerHTML = '';
    radios.appendChild(
      app.cameras.map(camera2elm)
      .reduce((fragment, elm) => fragment.appendChild(elm).parentNode,
        document.createDocumentFragment())).parentNode;
    ['#viewpage', '#loader', '#loader2'].forEach(hide);
    ['#loginpage', '#login'].forEach(show);
  } else if (view === 'CAMERA_ERROR') {
    ['#loader'].forEach(hide);
    ['#camerr'].forEach(show);
  } else if (view === 'LOGING_IN') {
    app.id = document.querySelector('#id').value;
    app.pass = document.querySelector('#pass').value;
    ['#loginerr'].forEach(hide);
    ['#loader2'].forEach(show);
  } else if (view === 'READY') {
    document.querySelector('#my-video').src = app.myVideoUrl;
    document.querySelector('#myid').textContent = app.xmppid;
    ['#loginpage', '#loader2', '#loader3'].forEach(hide);
    ['#viewpage', '#connect'].forEach(show);
  } else if (view === 'CONNECTING') {
    app.peerId = document.querySelector('#peer-id').value;
    ['#loader3'].forEach(show);
  } else if (view === 'CHATTING') {
    app.peerW = document.querySelector('#peer-container').clientWidth;
    app.peerH = document.querySelector('#peer-container').clientHeight;
    document.querySelector('#peer-video').src = app.peerVideoUrl;
    document.querySelector('#peer-video').style.width = app.peerW + 'px';
    app.peerVideoDOM = document.getElementById('peer-video');
    app.peerContainerDOM = document.getElementById('peer-container');
    if (app.thetaMode) {
      hide('#peer-video');
    } else {
      show('#peer-video');
    }
    ['#connect','#loader3'].forEach(hide);
  }
}

function occur(evt) {
  _view = nextView(_view, evt);
  update(_view, _app);
}

function waitCall(call) {
  call.on('stream', s => {
    _app.peerVideoUrl = URL.createObjectURL(s);
    occur('evtArrivePeer');
  });
}

function stopThetaView() {
  if (_thetatimer) return;
  cancelAnimationFrame(_thetatimer);
  _thetatimer = undefined;
}

function quit() {
  stopThetaView();
  if (_app.peerVideoUrl) URL.revokeObjectURL(_app.peerVideoUrl);
  if (_app.myVideoUrl) URL.revokeObjectURL(_app.myVideoUrl);
  webrtc.stopStream();
  webrtc.disconnect();
  xmpp.disconnect();
}

function animate() {
  _thetatimer = requestAnimationFrame(animate);
  thetaview.animate();
}

document.addEventListener('DOMContentLoaded', () => {

  webrtc.on('error', e => console.error(e));

  webrtc.on('call', call => {
    occur('evtOnCall');
    webrtc.answer(call);
    waitCall(call);
  });

  window.onload = () => {
    webcam.getUserMedia() // for force allow dialog.
      .then(() => webcam.init())
      .then(cameras => {
        _app.cameras = cameras;
        occur('ok');
      })
      .catch(() => occur('ng'));
  };

  window.onresize = () => {
    const w = document.querySelector('#peer-container').clientWidth;
    const h = document.querySelector('#peer-container').clientHeight;
    document.querySelector('#peer-video').style.width = w + 'px';
    document.querySelector('#peer-video').style.height = h + 'px';
    thetaview.resize(w, h);
  };

  document.querySelector('#login').addEventListener('click', () => {
    occur('evtClickLogin');
    xmpp.connect(_app.id, _app.pass)
      .then(() => webrtc.connect(xmpp.connection))
      .then(() => webcam.getUserMedia(getSelected('radio')))
      .then(s => {
        _app.xmppid = xmpp.id;
        _app.myVideoUrl = URL.createObjectURL(s);
        webrtc.stopStream();
        webrtc.setStream(s);
        occur('ok');
      })
      .catch(e => {
        console.error(e);
        _app.error = true;
        occur('ng');
      });
  });

  document.querySelector('#connect').addEventListener('click', () => {
    occur('evtClickConnect');
    waitCall(webrtc.call(_app.peerId));
  });


  document.querySelector('#logout').addEventListener('click', () => {
    occur('evtClickLogout');
    quit();
  });

  document.querySelector('#theta').addEventListener("click", () => {
    _app.thetaMode = !_app.thetaMode;
    occur('evtThetaView');
    if (_app.thetaMode) {
      thetaview.start(_app.peerVideoDOM, _app.peerContainerDOM, _app.peerW, _app.peerH);
      animate();
    } else {
      stopThetaView();
      thetaview.stop(_app.peerContainerDOM);
    }
  });

});
