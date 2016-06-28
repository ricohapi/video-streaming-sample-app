/* global m */
'use strict';

/**
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const App = require('./app').App;
const ThetaView = require('./thetaview').ThetaView;

const thetaview = new ThetaView();

const login = {};
login.vm = (() => {
  const vm = {};
  vm.init = (app, cb) => {
    vm._app = app;

    vm.cameras = [];
    vm.camstate = m.prop('loading');

    vm.login = () => {
      cb(false);
      vm._app.connect()
        .then(() => cb(true))
        .catch(() => cb(false));
    };

    vm.updateSelect = evt => {
      vm._app.camid(evt.target.value);
    };

    vm._app.list(cameras => { // todo on access error
      vm.cameras = cameras;
      if (vm._app.isOneWay) {
        vm.camstate('oneway');
      } else {
        vm.camstate(vm.cameras.length === 0 ? 'nocam' : 'ready');
      }
      cb(false);
    });
  };
  return vm;
})();

login.controller = function ctrl() {
  this.app = App.getInstance();
  this.vm = login.vm;

  login.vm.init(this.app, done => {
    m.redraw();
    if (done) {
      m.route('/streaming/vchat');
    }
  });
};

login.view_cam = (vm, camstate, isFireFox) => {
  const confirm = m('p', 'Please click `allow` on the top of the screen, ' +
    'so we can access your webcam for calls.');

  if ((camstate === 'oneway') || isFireFox) {
    return undefined;
  }
  if (camstate === 'nocam') {
    return [confirm, m('p', { class: 'err' }, 'No cameras.')];
  }
  if (camstate === 'fail') {
    return [confirm,
      m('p', { class: 'err' },
        'Failed to access the webcam. Make sure to run this demo on an' +
        'http server and click allow when asked for permission by the browser.'),
    ];
  }
  if (camstate === 'loading') {
    return m('span', { class: 'glyphicon glyphicon-refresh glyphicon-spin' });
  }
  return m('div', { class: 'form-group' }, [
    m('label', { for: 'inputcam' }, 'WebCam:'),
    m('div', { class: 'input-group' }, [
      m('span', { class: 'input-group-addon' },
        m('span', { class: 'glyphicon glyphicon-facetime-video' })),
      m('select', { id: 'inputcam', class: 'form-control', onchange: vm.updateSelect },
        vm.cameras.map(cam => m('option', { value: cam.id }, cam.label))),
    ]),
  ]);
};

login.view_connect = (vm, camstate, constate) => {
  if ((camstate !== 'ready') && (camstate !== 'oneway')) return undefined;

  const loginButton = constate === 'connecting' ?
    m('span', { class: 'glyphicon glyphicon-refresh glyphicon-spin' }) :
    m('button', { class: 'btn btn-success btn-block', onclick: vm.login }, 'Login');

  const errmsg = constate === 'fail' ?
    m('p', { class: 'err' }, 'Login failed.') : undefined;

  return [loginButton, errmsg];
};

login.view = ctrl => {
  const app = ctrl.app;
  const vm = ctrl.vm;

  return m('div', { class: 'form-login panel panel-default' }, [
    m('div', { class: 'panel-body' }, [
      m('h2', 'Video streaming sample'),
      m('div', { class: 'form-group' }, [
        m('label', { for: 'inputuser' }, 'ID:'),
        m('div', { class: 'input-group' }, [
          m('span', { class: 'input-group-addon' },
            m('span', { class: 'glyphicon glyphicon-user' })),
          m('input', {
            type: 'text',
            id: 'inputuser',
            class: 'form-control',
            placeholder: 'user@example.com',
            required: ' ',
            autofocus: ' ',
            oninput: m.withAttr('value', app.username),
            value: app.username(),
          }),
        ]),
      ]),
      m('div', { class: 'form-group' }, [
        m('label', { for: 'inputpass' }, 'Pass:'),
        m('div', { class: 'input-group' }, [
          m('span', { class: 'input-group-addon' },
            m('span', { class: 'glyphicon glyphicon-lock' })),
          m('input', {
            type: 'password',
            id: 'inputpass',
            class: 'form-control',
            placeholder: '********',
            required: ' ',
            oninput: m.withAttr('value', app.userpass),
            value: app.userpass(),
          }),
        ]),
      ]),
      login.view_cam(vm, vm.camstate(), app.isFirefox),
      login.view_connect(vm, vm.camstate(), app.state()),
    ]),
  ]);
};


const chat = {};
chat.vm = (() => {
  const vm = {};
  vm.init = (app, cb) => {
    vm._app = app;

    vm.isThetaView = m.prop(false);

    vm.call = () => vm._app.call();
    vm.open = () => vm._app.open();
    vm.copy = () => vm._app.copy();

    vm.theta = () => vm.isThetaView(!vm.isThetaView());

    vm.logout = () => {
      vm._app.disconnect();
      cb(true);
    };
  };
  return vm;
})();

chat.controller = function ctrl() {
  this.app = App.getInstance();
  if (this.app.state() === 'initial') {
    m.route('/streaming');
    return;
  }
  this.vm = chat.vm;

  chat.vm.init(this.app, done => {
    if (done) {
      m.route('/streaming');
    }
  });
};

chat.startPeer = elm => {
  thetaview.setContainer(elm);
  thetaview.start(elm.firstChild);
};

chat.stopPeer = elm => {
  thetaview.stop(elm.firstChild);
};

chat.view_peer = (vm, app, constate) => (constate !== 'chatting' ? undefined : [
  m('button', { class: 'btn btn-success btn-block', onclick: vm.theta },
    'Theta view'),
  m('div', { config: vm.isThetaView() ? chat.startPeer : chat.stopPeer }, [
    m('video', {
      id: app.peerurlid(),
      width: '100%',
      height: '100%',
      src: app.peerurl(),
      mozSrcObject: app.peermoz(),
      autoplay: ' ',
    }),
  ]),
]);

chat.view_call = (vm, constate) => {
  const connectButton = constate === 'calling' ?
    m('span', { class: 'glyphicon glyphicon-refresh glyphicon-spin' }) :
    m('button', { class: 'btn btn-success btn-block', onclick: vm.call },
      'Connect');
  return constate === 'chatting' ? undefined : connectButton;
};

chat.view_connect = (vm, app, constate) => {
  if (constate === 'chatready') return undefined;
  return m('p', [
    m('div', { class: 'form-group' }, [
      m('label', { for: 'inputpeer' }, 'Peer-ID:'),
      m('div', { class: 'input-group' }, [
        m('span', { class: 'input-group-addon' },
          m('span', { class: 'glyphicon glyphicon-user' })),
        m('input', {
          type: 'text',
          id: 'inputpeer',
          class: 'form-control',
          placeholder: 'user@example.com',
          required: ' ',
          autofocus: ' ',
          oninput: m.withAttr('value', app.peername),
          value: app.peername(),
        }),
      ]),
    ]),
    chat.view_call(vm, constate),
  ]);
};

chat.view_my = (app, constate) => {
  if ((constate === 'ready') || app.isWatcher) return undefined;
  return [m('div', { class: 'text-center' },
    m('video', {
      src: app.myurl(),
      mozSrcObject: app.mymoz(),
      width: 200,
      height: 200,
      autoplay: ' ',
    })
  )];
};

chat.view_open = (vm, app, constate) => {
  if (constate !== 'ready') return undefined;
  if (app.isOneWay) return undefined;
  return m('button', { class: 'btn btn-success btn-block', onclick: vm.open }, 'Open');
};

chat.view = ctrl => {
  const app = ctrl.app;
  const vm = ctrl.vm;

  return m('div', { class: 'row' }, [
    m('div', { class: 'col-md-9' }, chat.view_peer(vm, app, app.state())),

    m('div', { class: 'col-md-3' }, [
      m('div', { class: 'panel panel-default form-call' }, [
        m('p', [
          m('div', { class: 'form-group' }, [
            m('label', { for: 'inputmy' }, 'ID:'),
            m('div', { class: 'input-group' }, [
              m('input', {
                type: 'text',
                id: 'inputmy',
                class: 'form-control',
                readonly: ' ',
                value: app.username(),
              }),
              m('span', { class: 'input-group-btn' },
                m('button', { class: 'btn btn-default cpbtn', 'data-clipboard-target': '#inputmy' },
                  m('i', { class: 'glyphicon glyphicon-paperclip' })
                )),
            ]),
          ]),
          chat.view_open(vm, app, app.state()),
        ]),
        chat.view_connect(vm, app, app.state()),
        m('button', { class: 'btn btn-danger btn-block', onclick: vm.logout }, 'Logout'),
        chat.view_my(app, app.state()),
      ]),
    ]),
  ]);
};

module.exports.login = login;
module.exports.chat = chat;
