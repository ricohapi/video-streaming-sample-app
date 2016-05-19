'use strict';
/**
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const AuthClient = require('ricohapi-auth').AuthClient;

function _log(str) {
  console.log(str);
}

class UDCStrophe {
  constructor(clientID, clientSecret) {
    this._client = new AuthClient(clientID, clientSecret);
  }

  _onConnect(self, status) {
    if (status == Strophe.Status.CONNECTING) {
      _log('Strophe is connecting.');
    } else if (status == Strophe.Status.CONNFAIL) {
      _log('Strophe failed to connect.');
      self.connectReject();
    } else if (status == Strophe.Status.DISCONNECTING) {
      _log('Strophe is disconnecting.');
    } else if (status == Strophe.Status.DISCONNECTED) {
      _log('Strophe is disconnected.');
    } else if (status == Strophe.Status.CONNECTED) {
      _log('Strophe is connected.');
      self.connection.send($pres());
      self.connectResolve();
    } else if (status == Strophe.Status.AUTHENTICATING) {
      _log('Strophe is authenticating.');
    } else if (status == Strophe.Status.AUTHFAIL) {
      _log('Strophe is authfail.');
      self.connectReject();
    }
  }

  connect(userID, userPass) {
    this._client.setResourceOwnerCreds(userID.split('+')[0], userPass);
    this.id = userID;

    return new Promise((resolve, reject) => {
      this._client.session(AuthClient.SCOPES.VStream)
        .then(() => {
          this.connection = new Strophe.Connection('https://sig.ricohapi.com/http-bind/');
          Strophe.SASLSHA1.test = () => false;
          this.connectResolve = resolve;
          this.connectReject = reject;
          this.connection.connect(userID.replace(/@/g, '\\40') + '@sig.ricohapi.com@sig.ricohapi.com/peer', this._client.accessToken, this._onConnect.bind(this, this));
        })
        .catch(e => reject(e));
    });
  }

  disconnect() {
    if (this.connection === undefined) return;
    this.connection.disconnect('none');
    this.connection = undefined;
  }

};
exports.UDCStrophe = UDCStrophe;
