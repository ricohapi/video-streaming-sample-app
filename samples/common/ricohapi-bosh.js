/* global Strophe */
/* eslint no-console: ["error", { allow: ["info"] }] */
'use strict';
/*
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const EventEmitter = require('events').EventEmitter;
const AuthClient = require('ricohapi-auth').AuthClient;
// const Strophe = require('node-strophe').Strophe.Strophe;

if (Strophe.SASLSHA1) {
  Strophe.SASLSHA1.test = () => false;
}

const MSGS = {};
MSGS[Strophe.Status.CONNECTING] = 'The connection is currently being made.';
MSGS[Strophe.Status.CONNFAIL] = 'The connection attempt failed.';
MSGS[Strophe.Status.AUTHENTICATING] = 'The connection is authenticating.';
MSGS[Strophe.Status.AUTHFAIL] = 'The authentication attempt failed.';
MSGS[Strophe.Status.CONNECTED] = 'The connection has succeeded.';
MSGS[Strophe.Status.DISCONNECTED] = 'The connection has been terminated.';
MSGS[Strophe.Status.DISCONNECTING] = 'The connection is currently being terminated.';
MSGS[Strophe.Status.ATTACHED] = 'The connection has been attached.';
MSGS[Strophe.Status.ERROR] = 'An error has occurred.';

class BoshClient extends EventEmitter {

  _getBareJID(userID) {
    return `${userID.replace(/@/g, '\\40')}@sig.ricohapi.com`;
  }

  _getUserID(jid) {
    return jid.split('@')[0].replace(/\\40/g, '@');
  }

  _onConnect(resolve, reject, status) {
    console.info(MSGS[status]);

    if ((status === Strophe.Status.AUTHFAIL) ||
      (status === Strophe.Status.CONNFAIL) ||
      (status === Strophe.Status.ERROR)) {
      reject(MSGS[status]);
      return true;
    }
    if (status === Strophe.Status.CONNECTED) {
      this._strophe.send(new Strophe.Builder('presence'));
      resolve(MSGS[status]);
    }
    return true;
  }

  _onMessage(stanza) {
    const jid = Strophe.getBareJidFromJid(stanza.attributes.from.value);
    const userID = this._getUserID(jid);
    if (stanza.firstChild.nodeType !== 3) return true;
    // nodeType:3 NODE.TEXT_NODE
    this.emit('message', userID, stanza.firstChild.textContent);
    return true;
  }

  constructor(authClient) {
    super();
    this._authClient = authClient;
    this._strophe = null;
    this._onMessageHandler = null;
  }

  connect(userID, userPass) {
    this.id = userID;
    return new Promise((resolve, reject) => {
      this._authClient.setResourceOwnerCreds(userID.split('+')[0], userPass);
      this._authClient.session(AuthClient.SCOPES.VStream)
        .then(result => {
          this._strophe = new Strophe.Connection('https://sig.ricohapi.com/http-bind/');
          this._onMessageHandler =
            this._strophe.addHandler(this._onMessage.bind(this), null, 'message');
          const jid = `${this._getBareJID(userID)}@sig.ricohapi.com/boshsdk`;
          this._strophe.connect(jid, result.access_token,
            this._onConnect.bind(this, resolve, reject));
        })
        .catch(reject);
    });
  }

  disconnect() {
    if (!this._strophe) return;
    this._strophe.disconnect('normal');
    if (this._onMessageHandler) {
      this._strophe.deleteHandler(this._onMessageHandler);
    }
    this._onMessageHandler = null;
    this._strophe = null;
  }

  send(to, message) {
    const jid = this._getBareJID(to);
    this._strophe.send(new Strophe.Builder('message', { to: jid }).t(message));
  }
}

exports.AuthClient = AuthClient;
exports.BoshClient = BoshClient;
