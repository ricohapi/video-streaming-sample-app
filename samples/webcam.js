'use strict';
/**
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

class Webcam {
  constructor() {
    navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  };

  _enumerateDevice() {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const valid = devices.filter(o => (o.kind === 'videoinput') && (o.label !== ''));
          resolve(valid.map(o => ({ id: o.deviceId, label: o.label })));
        })
        .catch(e => reject(e));
    });
  }

  _getSources() {
    return new Promise((resolve, reject) => {
      if (typeof MediaStreamTrack.getSources === 'undefined') {
        console.log('MediaStreamTrack.getSources not supported');
        return reject;
      }
      MediaStreamTrack.getSources(data => {
        const valid = data.filter(o => (o.kind === 'video') && (o.label !== ''));
        return resolve(valid.map(o => ({ id: o.id, label: o.label })));
      });
    });
  }

  init() {
    return (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) ?
      this._getSources() : this._enumerateDevice();
  };

  getUserMedia(src) {
    let option = {};
    if (src) {
      option = {
        video: { mandatory: { sourceId: src } },
        audio: false,
      };
    } else {
      option = { video: true, audio: false };
    }
    return new Promise((resolve, reject) => {
      navigator.getUserMedia(option, s => resolve(s), e => reject(e));
    });
  };

};

exports.Webcam = Webcam;
