/* global m,USER */
'use strict';

/**
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const App = require('./app').App;
const Compo = require('./components');

// window.__oneway = true;

if (typeof m === 'undefined') { // headless
  const app = App.getInstance();
  app.headless(USER.userId, USER.userPass,
    document.querySelector('#wrapper'));
} else {
  m.route.mode = 'hash';
  m.route(document.querySelector('#wrapper'),
    '/streaming/', {
      '/streaming': Compo.login,
      '/streaming/vchat': Compo.chat,
    });
}
