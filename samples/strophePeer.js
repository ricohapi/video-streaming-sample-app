'use strict';

/**
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 *
 * use xmpp(strophe.connection) on peerjs
 * override peerjs Sock class
 */

const EventEmitter = require('events');

function _log(typ, obj) {
//  console.log({ type: typ, data: obj });
}

class StrophePeer extends EventEmitter {

  constructor() {
    super();
  }

  connect(strophe, cid) {
    _log('log', 'connect called');
    this.strophe = strophe;

    return new Promise((resolve, reject) => {

      // inject strophe in peerJS
      Socket.prototype.close = () => {};
      Socket.prototype.start = () => {};
      Socket.prototype.send = data => {
        _log('send', data)
        this.strophe.send($msg({
          to: data.dst + '@sig.ricohapi.com'
        }).t(JSON.stringify(data)));
      }

      this.peer = new Peer(cid);
      this.peer.on('open', () => {
        _log('log', 'webrtc connected')
        resolve();
      });
      this.peer.on('error', reject);
      this.peer.on('call', call => this.emit('call', call));

      const msgHandler = message => {
        _log('onMessage', message)
        try {
          // change XMPP message for PeerJS
          const id = Strophe.getBareJidFromJid(message.attributes['from'].value).split('@')[0];
          // to judge if peerjs message or not, and fire events for each listeners.
          // <message from=.... >
          //   { type: 'OPEN' | 'OFFER' | 'ANSWER' | 'CANDIDATE'
          //     src: jid
          //     ...
          //   }
          // </message>
          if (message.firstChild.nodeType == 3 /* NODE.TEXT_NODE */ ) {
            const json = JSON.parse(message.firstChild.textContent);
            if (json.type) {
              json.src = id;
              this.peer.socket.emit('message', json);
            }
          }
        } catch (e) {
          _log(e);
        }
        return true;
      };
      this.strophe.addHandler(msgHandler, null, 'message', null);
      this.peer.socket.emit('message', { "type": "OPEN" });
    });
  }

  disconnect() {
    this.peer.disconnect();
  }

  setStream(stream) {
    this._localStream = stream;
  };

  call(cid) {
    _log('log', 'call called');
    if (!this._localStream) {
      _log('log', 'no localstream');
      return;
    }
    return this.peer.call(cid.replace(/@/g, '\\40'), this._localStream);
  }

  answer(call) {
    if (!this._localStream) {
      _log('log', 'no localstream');
      return;
    }
    call.answer(this._localStream);
  }

  stopStream() {
    if (!this._localStream) {
      _log('log', 'no localstream');
      return;
    }
    this._localStream.getVideoTracks()[0].stop();
    this._localStream = undefined;
  };

};

exports.StrophePeer = StrophePeer;
