'use strict';

function SendgridServer(options, config) {
  const sendgrid = this;

  sendgrid.version = require('../package.json').version;

  sendgrid.config = {
    smtpPort: 5870,
    apiPort: 5871,
    allowUnauthorized: true,
    behaviors: {
      reject: '+should+reject+',
      drop: '+should+drop+',
      bounce: '+should+bounce+',
      defer: '+should+defer+',
      open: '+should+open+',
      click: '+should+click+',
      unsubscribe: '+should+unsubscribe+',
      spam: '+should+spam+'
    }
  };

  sendgrid.options = {
    name: 'mock-sendgrid-server',
    host: '0.0.0.0',
    silent: false
  };

  sendgrid.util = require('./util');

  sendgrid.store = require('./dataStore')(sendgrid);

  //////////////////////////////////////////////////

  if (options) {
    Object.assign(sendgrid.options, options);
  }

  if (config) {
    Object.assign(sendgrid.config, config);

    if (sendgrid.config.users) {
      sendgrid.config.users.forEach(function(user) {
        user.webhooks = user.webhooks || [];

        console.log('  Adding user %s with %d webhooks',
          sendgrid.util.colorize('cyan', user.name),
          user.webhooks.length);
        sendgrid.store.addUser(user);
      });
    }
  }

  //////////////////////////////////////////////////

  sendgrid.webhooks = require('./webhooks')(sendgrid);
  sendgrid.pipeline = require('./pipeline')(sendgrid);
  sendgrid.messages = require('./messages')(sendgrid);
  sendgrid.smtp = require('./smtp')(sendgrid);
  sendgrid.api = require('./api')(sendgrid);

  //////////////////////////////////////////////////

  sendgrid.boot = function() {
    sendgrid.smtp.boot();
    sendgrid.api.boot();
  };

  return sendgrid;
}

module.exports = SendgridServer;
