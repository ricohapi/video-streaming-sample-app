/* eslint no-console: ["error", { allow: ["info"] }] */
'use strict';
/*
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

export class UDCConnection {
  _isData(session) {
    return !session.audio && !session.video && !session.screen && session.data;
  }

  constructor(conn, connectCallback) {
    const connection = conn;

    connection.socket = connection.bosh; // set here, can't set on caller

    connection.socket.onmessage = (uid, data) => {
      console.info(`${data.eventName} received`);
      if (data.eventName === connection.socketMessageEvent) {
        connection.socket.onMessagesCallback(data.data);
      }
    };

    connection.socket.onMessagesCallback = message => {
      const myJid = connection.userid.replace(/@/g, '\\40');
      const toJid = message.remoteUserId.replace(/@/g, '\\40');
      if (myJid !== toJid) return;

      const senderPeer = connection.peers[message.sender];
      if (senderPeer && senderPeer.extra !== message.extra) {
        senderPeer.extra = message.extra;
        connection.onExtraDataUpdated({ userid: message.sender, extra: message.extra });
      }

      if (message.message.streamSyncNeeded && senderPeer) {
        console.info('streamSyncNeeded NOT SUPPORTED');
        return;
      }

      if (message.message === 'connectWithAllParticipants') {
        console.info('connectWithAllParticipants NOT SUPPORTED');
        return;
      }

      if (message.message === 'removeFromBroadcastersList') {
        console.info('removeFromBroadcastersList NOT SUPPORTED');
        return;
      }

      if (message.message === 'dropPeerConnection') {
        console.info('dropPeerConnection NOT SUPPORTED');
        return;
      }

      if (message.message.allParticipants) {
        console.info('allParticipants NOT SUPPORTED');
        return;
      }

      if (message.message.newParticipant) {
        console.info('newParticipant NOT SUPPORTED');
        return;
      }

      if (message.message.readyForOffer || message.message.addMeAsBroadcaster) {
        connection.addNewBroadcaster(message.sender);
      }

      if (message.message.newParticipationRequest && message.sender !== connection.userid) {
        if (senderPeer) connection.deletePeer(message.sender);

        const offerAudio = connection.sdpConstraints.mandatory.OfferToReceiveAudio;
        const offerVideo = connection.sdpConstraints.mandatory.OfferToReceiveVideo;
        const ses = connection.session;
        const msg = message.message;
        const noRemoteSdp = { OfferToReceiveAudio: offerAudio, OfferToReceiveVideo: offerVideo };
        const oneLocalSdp = { OfferToReceiveAudio: !!ses.audio, OfferToReceiveVideo: !!ses.video };
        const noLocalSdp = ses.oneway ? oneLocalSdp : noRemoteSdp;
        const rOneWay = !!ses.oneway || connection.direction === 'one-way';
        const noNeedRemoteStream = typeof msg.isOneWay !== 'undefined' ? msg.isOneWay : rOneWay;

        const userPref = {
          extra: message.extra || {},
          localPeerSdpConstraints: msg.remotePeerSdpConstraints || noRemoteSdp,
          remotePeerSdpConstraints: msg.localPeerSdpConstraints || noLocalSdp,
          isOneWay: noNeedRemoteStream,
          dontGetRemoteStream: noNeedRemoteStream,
          isDataOnly: typeof msg.isDataOnly !== 'undefined' ? msg.isDataOnly : this._isData(ses),
          dontAttachLocalStream: !!msg.dontGetRemoteStream,
          connectionDescription: message,
          successCallback: () => {
            if (noNeedRemoteStream || rOneWay || this._isData(connection.session)) {
              connection.addNewBroadcaster(message.sender, userPref);
            }
          },
        };
        connection.onNewParticipant(message.sender, userPref);
        return;
      }

      if (message.message.shiftedModerationControl) {
        console.info('shiftedModerationControl NOT SUPPORTED');
        return;
      }

      if (message.message.changedUUID) {
        console.info('changedUUID NOT SUPPORTED');
        // no return
      }

      if (message.message.userLeft) {
        connection.multiPeersHandler.onUserLeft(message.sender);
        if (!!message.message.autoCloseEntireSession) {
          connection.leave();
        }
        return;
      }

      connection.multiPeersHandler.addNegotiatedMessage(message.message, message.sender);
    };


    connection.socket.emit = (eventName, data, callback) => {
      if (eventName === 'changed-uuid') return;
      if (eventName === 'message') {
        // data:uid, callback:data on boshclient
        connection.socket.onmessage(data, JSON.parse(callback));
        return;
      }
      if (typeof data === 'undefined') return;
      if (data.message && data.message.shiftedModerationControl) return;

      if (eventName === 'disconnect-with') {
        if (connection.peers[data]) {
          connection.peers[data].peer.close();
        }
        return;
      }
      connection.socket.send(data.remoteUserId, JSON.stringify({ eventName, data }));
      console.info(`${eventName} sended`);
      if (callback) { callback(); }
    };
    connectCallback(connection.socket);
  }
}
