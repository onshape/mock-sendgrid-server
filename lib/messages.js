'use strict';

const MESSAGE_STATES = {
  NONE: 'none',
  RECEIVED: 'received',
  PROCESSED: 'processed',
  DROPPED: 'dropped',
  DELIVERED: 'delivered',
  BOUNCE: 'bounce',
  DEFERRED: 'deferred',
  OPEN: 'open',
  CLICK: 'click',
  UNSUBSCRIBE: 'unsubscribe',
  SPAM: 'spamreport'
};

function Messages(sendgrid) {
  const self = this;

  self.states = MESSAGE_STATES;

  self.message = function({
    user, ip, tls, to, toName, from, fromName,
    subject, body, messageId, timestamp
  }) {

    const id = 'msg_' + sendgrid.store.generateId(24);
    const message = {
      id: id,
      state: MESSAGE_STATES.RECEIVED,
      ip: ip,
      tls: tls,
      user: user || 'default',
      to: to || null,
      toName: toName || null,
      from: from || null,
      fromName: fromName || null,
      subject: subject || null,
      body: body || null,
      messageId: messageId || `<${ id }.${ from }>`,
      timestamp: timestamp || sendgrid.util.timestamp(),
      read: false,
      deleted: false
    };

    sendgrid.store.addMessage(to, message);
    sendgrid.pipeline.processMessage(message);

    return message;
  };

  return self;
}

module.exports = function(sendgrid) {
  return new Messages(sendgrid);
};
