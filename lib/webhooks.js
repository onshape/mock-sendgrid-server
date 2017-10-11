'use strict';

const request = require('request');

function Webhooks(sendgrid) {
  const self = this;

  self.event = function(message) {
    const event = {
      sg_message_id: message.id,
      email: message.to,
      timestamp: message.timestamp,
      'smtp-id': message.messageId,
      event: message.state
    };
    return event;
  };

  self.sendEvents = function(webhook, events) {
    const options = {
      body: events,
      json: true,
      method: 'POST',
      url: webhook.url
    };

    if (webhook.username) {
      options.auth = {
        username: webhook.username,
        password: webhook.password
      };
    }

    request(options, function(error, response) {
      if (!sendgrid.options.silent) {
        console.log('%s [%s/%s]: %s', sendgrid.util.colorize('blue', 'WEBHOOK'), response.statusCode, events[0].event, error || events[0].sg_message_id);
      }
    });
  };

  self.triggerEvent = function(message) {
    if (message.user) {
      const webhooks = sendgrid.store.getWebhooks(message.user);
      if (Array.isArray(webhooks) && webhooks.length) {

        const event = self.event(message);

        for (const webhook of webhooks) {
          self.sendEvents(webhook, [ event ]);
        }
      }
    }
  };

  return self;
}

module.exports = function(sendgrid) {
  return new Webhooks(sendgrid);
};
