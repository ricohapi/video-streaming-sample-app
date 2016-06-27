'use strict';

/**
 * Copyright (c) 2016 Ricoh Company, Ltd. All Rights Reserved.
 * See LICENSE for more information
 */

(() => {
  const logs = [];
  const MAX_LENGTH = 100;
  const Console = console;

  window.getLogs = () => {
    const result = logs.concat();
    logs.length = 0;
    return result;
  };

  window.onerror = message => {
    logs.push({
      type: 'error',
      message,
    });
  };

  function hookConsole(name) {
    const func = Console[name];
    Console[name] = (...args) => {
      func.apply(Console, args);
      if (logs.length < MAX_LENGTH) {
        logs.push({
          type: name,
          message: args.join(', '),
        });
      }
    };
  }

  hookConsole('error');
  hookConsole('warn');
  hookConsole('info');
  hookConsole('debug');
  Console.log = Console.debug;
})();
