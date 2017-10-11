'use strict';

const SMTPServer = require('smtp-server').SMTPServer;
const simpleParser = require('mailparser').simpleParser;

function SMTP(sendgrid) {
  const self = this;

  //////////////////////////////////////////////////

  self.connect = function(session, callback) {
    callback(null);
  };

  self.auth = function(auth, session, callback) {
    for (const user of sendgrid.store.getUsers()) {
      if (auth.username === user.username) {
        if (!user.password || auth.password === user.password) {
          return callback(null, {
            user: user.name
          });
        } else {
          return callback(new Error('Invalid username or password'));
        }
      }
    }
    return callback(new Error('Invalid username or password'));
  };

  self.mailFrom = function(address, session, callback) {
    callback(null);
  };

  self.rcptTo = function(address, session, callback) {
    callback(null);
  };

  self.message = function(session, message, callback) {
    sendgrid.messages.message({
      user: session.user,
      ip: session.remoteAddress,
      tls: session.secure,
      to: message.to.value[0].address,
      toName: message.to.value[0].name,
      from: message.from.value[0].address,
      fromName: message.from.value[0].name,
      subject: message.subject,
      body: message.html || message.text,
      messageId: message.messageId
    });

    callback(null);
  };

  self.data = function(stream, session, callback) {
    simpleParser(stream, function(err, message) {
      if (err) {
        callback(err);
      } else {
        self.message(session, message, callback);
      }
    });
  };

  //////////////////////////////////////////////////

  sendgrid.smtpServer = new SMTPServer({
    name: sendgrid.options.name + ' SMTP Server',
    authOptional: sendgrid.config.allowUnauthorized,
    allowInsecureAuth: true,
    disableReverseLookup: true,
    onAuth: self.auth,
    onConnect: self.connect,
    onMailFrom: self.mailFrom,
    onRcptTo: self.rcptTo,
    onData: self.data
  });

  self.boot = function() {
    sendgrid.smtpServer.listen(sendgrid.config.smtpPort, function() {
      console.log(`Mock Sendgrid SMTP Server running on ${ sendgrid.config.smtpPort }`);
    });
  };

  return self;
}

module.exports = function(sendgrid) {
  return new SMTP(sendgrid);
};
