'use strict';

/**
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

const path = require('path');
const EventEmitter = require('events');
const Xvfb = require('xvfb');
const firefox = require('selenium-webdriver/firefox');
const Console = console;

class HeadlessBrowser extends EventEmitter {
  constructor() {
    super();
    this._driver = null;
    this._xvfb = null;
  }

  start() {
    this._xvfb = new Xvfb();
    this._xvfb.startSync();
    const profile = new firefox.Profile();
    profile.setPreference('media.navigator.permission.disabled', true);
    const options = new firefox.Options().setProfile(profile);
    this._driver = new firefox.Driver(options);
    const url = `file://${path.resolve(__dirname, '../index.html')}`;
    this._driver.get(url);
    this._loop();
  }

  stop() {
    if (this._xvfb) {
      this._xvfb.stopSync();
      this._xvfb = null;
    }
    if (this._driver) {
      this._driver.quit();
      this._driver = null;
    }
  }

  _loop() {
    if (this._driver) {
      this._printLogs();
      setTimeout(this._loop.bind(this), 1000);
    }
  }

  _printLogs() {
    const script = 'return typeof(getLogs) === "function" ? getLogs() : [];';
    this._driver.executeScript(script)
      .then(logs => {
        for (const log of logs) {
          switch (log.type) {
            case 'error':
              this.emit('error', log.message);
              break;
            case 'warn':
              this.emit('warn', log.message);
              break;
            case 'info':
              this.emit('info', log.message);
              break;
            case 'debug':
              this.emit('debug', log.message);
              break;
            default: break;
          }
        }
      });
  }
}

const headless = new HeadlessBrowser();
headless.on('error', Console.error);
headless.on('warn', Console.warn);
headless.on('info', Console.info);
// headless.on('debug', Console.log);
headless.start();
process.on('SIGINT', () => {
  Console.info('exit');
  headless.stop();
  process.exit();
});
Console.info('hit ctrl+c to quit');
